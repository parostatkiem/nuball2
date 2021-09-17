import React, { useEffect, useRef, useState } from "react";
import Player from "../Player/Player";
import {
  PLAYER_RADIUS,
  KEY_UP,
  KEY_DOWN,
  KEY_LEFT,
  KEY_RIGHT,
  CONTROL_REFRESH_RATE,
  MOVE_AMOUNT_PER_REFRESH,
  BALL_RADIUS,
  BALL_TOUCH_SPEED,
  KEY_KICK,
  BALL_KICK_SPEED,
  DEFAULT_POSITION_YELLOW,
} from "../../constants";
import {
  getCenterPoint,
  moveTheFurthestPossible,
  getDistanceBetween,
  getOffsetFromPosition,
} from "../../physics";

const ballKickSound = new Audio(process.env.PUBLIC_URL + "kick.wav");

const PlayableCharacter = ({
  uuid,
  fieldInfo,
  pubnub,
  otherPlayers,
  ballPosition,
  initialPosition,
  onBallVelocitySet,
  isRightSided,
}) => {
  const keyState = useRef({});
  const keyEventLogger = function (e) {
    keyState.current[e.keyCode] = e.type === "keydown";
  };

  const [position, setPosition] = useState(initialPosition);

  useEffect(() => {
    window.addEventListener("keydown", keyEventLogger);
    window.addEventListener("keyup", keyEventLogger);
    return () => {
      window.removeEventListener("keydown", keyEventLogger);
      window.removeEventListener("keyup", keyEventLogger);
    };
  }, [pubnub]);

  useEffect(() => {
    setPosition(initialPosition);
  }, [initialPosition]);

  useEffect(
    () => fieldInfo && setInterval(moveIfNeeded, CONTROL_REFRESH_RATE),
    [fieldInfo]
  );

  useEffect(() => {
    pubnub.signal({
      channel: "ch1",
      message: { type: "pm", p: getOffsetFromPosition(position, fieldInfo) },
    });
  }, [position]);

  useEffect(() => {
    if (keyState.current[KEY_KICK]) kickBall(position, ballPosition);
    else slowlyMoveBall(position, ballPosition);
  }, [position, ballPosition]);

  async function kickBall(playerPos, ballPos) {
    if (
      getDistanceBetween(
        getCenterPoint(playerPos.x, playerPos.y, PLAYER_RADIUS),
        getCenterPoint(ballPos.x, ballPos.y, BALL_RADIUS)
      ) >
      PLAYER_RADIUS + BALL_RADIUS + 3
    )
      return;
    ballKickSound.play();
    onBallVelocitySet(
      ballPos.x - playerPos.x,
      ballPos.y - playerPos.y,
      BALL_KICK_SPEED
    );
  }

  async function slowlyMoveBall(playerPos, ballPos) {
    if (
      getDistanceBetween(
        getCenterPoint(playerPos.x, playerPos.y, PLAYER_RADIUS),
        getCenterPoint(ballPos.x, ballPos.y, BALL_RADIUS)
      ) >
      PLAYER_RADIUS + BALL_RADIUS + 0.5
    )
      return;
    onBallVelocitySet(
      ballPos.x - playerPos.x,
      ballPos.y - playerPos.y,
      BALL_TOUCH_SPEED
    );
  }

  function moveIfNeeded() {
    const obstaclesArray = [
      ...otherPlayers,
      { position: ballPosition, radius: BALL_RADIUS },
    ];

    // console.log("b", obstaclesArray);
    if (keyState.current[KEY_UP])
      setPosition((pos) =>
        moveTheFurthestPossible(
          pos,
          0,
          -MOVE_AMOUNT_PER_REFRESH,
          obstaclesArray,
          fieldInfo
        )
      );

    if (keyState.current[KEY_DOWN])
      setPosition((pos) =>
        moveTheFurthestPossible(
          pos,
          0,
          MOVE_AMOUNT_PER_REFRESH,
          obstaclesArray,
          fieldInfo
        )
      );

    if (keyState.current[KEY_LEFT])
      setPosition((pos) =>
        moveTheFurthestPossible(
          pos,
          -MOVE_AMOUNT_PER_REFRESH,
          0,
          obstaclesArray,
          fieldInfo
        )
      );

    if (keyState.current[KEY_RIGHT])
      setPosition((pos) =>
        moveTheFurthestPossible(
          pos,
          MOVE_AMOUNT_PER_REFRESH,
          0,
          obstaclesArray,
          fieldInfo
        )
      );
  }

  if (!fieldInfo) return null;
  return <Player uuid={uuid} position={position} isRightSided={isRightSided} />;
};

export default PlayableCharacter;
