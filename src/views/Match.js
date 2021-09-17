import React, { useEffect, useRef, useState, useContext } from "react";
import Ball from "../components/Ball/Ball";
import GoalNet from "../components/GoalNet/GoalNet";
import PlayableCharacter from "../components/PlayableCharacter/PlayableCharacter";
import Player from "../components/Player/Player";
import {
  BALL_RADIUS,
  BALL_REFRESH_RATE,
  BALL_SLOWDOWN_RATE,
  DEFAULT_BALL_POSITION,
  DEFAULT_POSITION_BLUE,
  DEFAULT_POSITION_YELLOW,
  KEY_RESET_POINTS,
  KEY_RESTART,
  KEY_SHUFFLE,
  PLAYER_RADIUS,
} from "../constants";
import { PubNubContext } from "../contexts/pubnub";
import {
  getCenterPoint,
  getDistanceToWall,
  getPositionFromOffset,
  getOffsetFromPosition,
  roundPositionToDecimals,
} from "../physics";
import "./Match.scss";

const fieldWidth = 800;
const fieldHeight = 500;
const TEST_PLAYER = {
  uuid: "test",
  position: { x: 350, y: 300 },
  radius: PLAYER_RADIUS,
  isRightSided: true,
};

const MAIN_PLAYER = {
  uuid: "main_player",
  position: { x: 0, y: 0 },
  radius: PLAYER_RADIUS,
  isRightSided: false,
  isPlayable: true,
};

function shuffleArray(array) {
  for (var i = array.length - 1; i > 0; i--) {
    var rand = Math.floor(Math.random() * (i + 1));
    [array[i], array[rand]] = [array[rand], array[i]];
  }
}

const Match = () => {
  const fieldRef = useRef();
  const ballMovementInterval = useRef();
  const ballMovementTick = useRef(0);
  const lastBallUpdateTimetoken = useRef(0);
  const [fieldInfo, setFieldInfo] = useState();
  const [players, setPlayers] = useState([MAIN_PLAYER]);
  const [ballPosition, setBallPosition] = useState({ x: 0, y: 0 });
  const pubnub = useContext(PubNubContext);
  const [goals, setGoals] = useState({ left: 0, right: 0 });

  const netHeight = fieldInfo?.height / 3;
  const netTop = fieldInfo?.top + (fieldInfo?.height - netHeight) / 2;

  function stopTheBall() {
    ballMovementTick.current = 0;
    clearInterval(ballMovementInterval.current);
  }

  function handleKeyPressed(e) {
    if (e.key === KEY_RESTART) {
      handleGameRestart();
    }
    if (e.key === KEY_RESET_POINTS) {
      setGoals({ left: 0, right: 0 });
    }
  }

  useEffect(() => {
    if (goals.left !== 0 || goals.right !== 0) {
      setTimeout(() => {
        handleGameRestart();
      }, 1000);
    }
  }, [goals]);

  useEffect(() => {
    const fieldRect = fieldRef.current.getBoundingClientRect();
    setFieldInfo({
      left: fieldRect.left,
      top: fieldRect.top,
      height: fieldHeight,
      width: fieldWidth,
    });
  }, [setFieldInfo]);

  useEffect(() => {
    if (!fieldInfo || !pubnub) return;
    window.addEventListener("keypress", handleKeyPressed);

    getConnectedPlayers().then(() => {
      setGoals({ left: 0, right: 0 });
      handleGameRestart();
    });

    pubnub.addListener({
      signal: function (event) {
        if (event.publisher !== pubnub.getUUID()) {
          if (event.message.type === "pm") {
            //PLAYER MOVEMENT
            setPlayers((others) => [
              ...others.filter((p) => p.uuid !== event.publisher),
              {
                uuid: event.publisher,
                position: getPositionFromOffset(event.message.p, fieldInfo),
              },
            ]);
          }
          if (
            event.message.type === "bm" && //BALL MOVEMENT
            event.timetoken > lastBallUpdateTimetoken.current
          ) {
            setBallPosition(getPositionFromOffset(event.message.p, fieldInfo));
            lastBallUpdateTimetoken.current = event.timetoken;
          }
        }
      },
      presence: function (event) {
        if (event.uuid !== pubnub.getUUID()) {
          // ignore myself joinging in
          if (event.action === "join") addUser(event.uuid);
          if (event.action === "leave" || event.action === "timeout")
            removeUser(event.uuid);
        }
      },
    });

    pubnub.subscribe({
      channels: ["ch1"],
      withPresence: true,
    });

    return () => {
      pubnub.unsubscribe({
        channels: ["ch1"],
      });
      window.removeEventListener("keypress", handleKeyPressed);
    };
  }, [fieldInfo, pubnub]);

  async function getConnectedPlayers() {
    const result = await pubnub.hereNow({
      channels: ["ch1"],
      includeUUIDs: true,
      includeState: true,
    });
    const playersToAdd = result.channels["ch1"]?.occupants || [];
    setPlayers((players) => [
      ...playersToAdd
        .filter((p) => !players.some((other) => other.uuid === p.uuid))
        .map((p) => ({ uuid: p.uuid })),
      ...players,
    ]);
    handleGameRestart();
  }

  const getNewBallCoordinate = (oldCoord, movementBase, multiplier) =>
    oldCoord + movementBase * multiplier;

  function handleBallVelocitySet(xFactor, yFactor, speed) {
    console.count("handle ball velocityset");
    if (ballMovementInterval.current) {
      clearInterval(ballMovementInterval.current);
      ballMovementTick.current = 0;
    }

    ballMovementInterval.current = setInterval(() => {
      const calculatedSpeed =
        speed - ballMovementTick.current * BALL_SLOWDOWN_RATE;

      setBallPosition((pos) => {
        let newX = getNewBallCoordinate(pos.x, xFactor, calculatedSpeed);
        let newY = getNewBallCoordinate(pos.y, yFactor, calculatedSpeed);
        const newCenterPoint = getCenterPoint(newX, newY, BALL_RADIUS);

        function bounceBallFromVerticalWall(wallCoord) {
          if (getDistanceToWall(newCenterPoint.x, wallCoord) > BALL_RADIUS)
            return;

          if (
            newCenterPoint.y > netTop &&
            newCenterPoint.y < netTop + netHeight
          ) {
            return;
          }

          stopTheBall();

          const xTouchingTheWall =
            xFactor > 0 ? wallCoord - 2 * BALL_RADIUS : wallCoord;
          const rateOfChange =
            (xTouchingTheWall - newX) / Math.abs(newX - pos.x);
          newY = pos.y + (newY - pos.y) * rateOfChange;
          newX = xTouchingTheWall;
          handleBallVelocitySet(-xFactor, yFactor, calculatedSpeed);
        }
        function bounceBallFromHorizontalWall(wallCoord) {
          if (getDistanceToWall(newCenterPoint.y, wallCoord) > BALL_RADIUS)
            return;
          stopTheBall();
          const yTouchingTheWall =
            yFactor > 0 ? wallCoord - 2 * BALL_RADIUS : wallCoord;
          const rateOfChange =
            (yTouchingTheWall - newY) / Math.abs(newY - pos.y);
          newX = pos.x + (newX - pos.x) * rateOfChange;
          newY = yTouchingTheWall;
          handleBallVelocitySet(xFactor, -yFactor, calculatedSpeed);
        }
        bounceBallFromVerticalWall(fieldInfo.left);
        bounceBallFromVerticalWall(fieldInfo.left + fieldInfo.width);
        bounceBallFromHorizontalWall(fieldInfo.top);
        bounceBallFromHorizontalWall(fieldInfo.top + fieldInfo.height);

        if (
          newX + 2 * BALL_RADIUS > fieldInfo.width + fieldInfo.left &&
          pos.x + 2 * BALL_RADIUS < fieldInfo.width + fieldInfo.left
        )
          setImmediate(() =>
            setGoals(({ left, right }) => ({ left: left + 1, right }))
          );

        if (newX < fieldInfo.left && pos.x > fieldInfo.left)
          setImmediate(() =>
            setGoals(({ left, right }) => ({ left, right: right + 1 }))
          );

        const newPosition = roundPositionToDecimals({ x: newX, y: newY });
        pubnub.signal({
          channel: "ch1",
          message: {
            type: "bm",
            p: getOffsetFromPosition(newPosition, fieldInfo),
          },
        });

        return newPosition;
      });

      if (calculatedSpeed <= 0) {
        stopTheBall();
        return;
      }

      ballMovementTick.current = ballMovementTick.current + 1;
    }, BALL_REFRESH_RATE);
  }

  function handleGameRestart() {
    if (!fieldInfo || !pubnub)
      return console.error("Cannot handle game restart");
    stopTheBall();
    setBallPosition(DEFAULT_BALL_POSITION(fieldInfo));

    //assign teams
    const playersTmp = [...players];
    shuffleArray(playersTmp);
    const leftSidedNumber = Math.floor(playersTmp.length / 2);
    const shuffledPlayers = playersTmp.map((player, index) => ({
      ...player,
      isRightSided: index >= leftSidedNumber,
      position:
        index >= leftSidedNumber
          ? DEFAULT_POSITION_BLUE(
              fieldInfo,
              PLAYER_RADIUS * 2 * (index - leftSidedNumber)
            )
          : DEFAULT_POSITION_YELLOW(
              fieldInfo,
              PLAYER_RADIUS * 2 * (index - leftSidedNumber)
            ),
    }));

    //replace player name
    shuffledPlayers.forEach((p) => {
      if (p.uuid === MAIN_PLAYER.uuid) p.uuid = pubnub.getUUID();
    });

    setPlayers(shuffledPlayers);
  }

  function addUser(uuid) {
    if (players.find((p) => p.uuid === uuid)) return;
    setPlayers((others) => [...others, { uuid, radius: PLAYER_RADIUS }]);
  }

  function removeUser(uuid) {
    setPlayers((others) => others.filter((p) => p.uuid !== uuid));
  }
  // console.log(players);
  return (
    <>
      <span id="players-counter">Players: {players.length}</span>
      <div
        ref={fieldRef}
        style={{ width: fieldWidth + "px", height: fieldHeight + "px" }}
        className="field"
      ></div>
      {fieldInfo && (
        <>
          <GoalNet
            points={goals.left}
            fieldInfo={fieldInfo}
            height={netHeight}
            top={netTop}
          />
          <GoalNet
            points={goals.right}
            fieldInfo={fieldInfo}
            height={netHeight}
            top={netTop}
            isRightSided
          />
          <Ball position={ballPosition} />
          {players.map((p) =>
            p.isPlayable ? (
              <PlayableCharacter
                key={p.uuid}
                uuid={p.uuid}
                fieldInfo={fieldInfo}
                pubnub={pubnub}
                otherPlayers={players.filter(
                  (p) => p.uuid !== pubnub.getUUID()
                )}
                ballPosition={ballPosition}
                onBallVelocitySet={handleBallVelocitySet}
                initialPosition={p.position}
                isRightSided={p.isRightSided}
              />
            ) : (
              <Player
                position={p.position}
                key={p.uuid}
                uuid={p.uuid}
                isRightSided={p.isRightSided}
              />
            )
          )}
        </>
      )}
    </>
  );
};

export default Match;
