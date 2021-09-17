import { PLAYER_RADIUS } from "./constants";

export const getCenterPoint = (x, y, r) => ({ x: x + r, y: y + r });

export function getDistanceBetween(pos1, pos2) {
  return Math.sqrt(Math.pow(pos1.x - pos2.x, 2) + Math.pow(pos1.y - pos2.y, 2));
}

export function getDistanceToWall(currentCoord, wallAtCoord) {
  return Math.abs(wallAtCoord - currentCoord);
}

export function getOffsetFromPosition(
  position,
  fieldInfo = { left: 0, top: 0 }
) {
  return { x: position.x - fieldInfo.left, y: position.y - fieldInfo.left };
}
export function getPositionFromOffset(
  position,
  fieldInfo = { left: 0, top: 0 }
) {
  console.log(fieldInfo);
  return { x: position.x + fieldInfo.left, y: position.y + fieldInfo.left };
}

export function moveTheFurthestPossible(
  currentPos,
  xMovement,
  yMovement,
  obstaclesArray,
  fieldInfo
) {
  const playerCenter = getCenterPoint(
    currentPos.x,
    currentPos.y,
    PLAYER_RADIUS
  );
  const playerCenterWannabe = {
    x: playerCenter.x + xMovement,
    y: playerCenter.y + yMovement,
  };

  function placeAtVerticalWall(wallCoord) {
    if (getDistanceToWall(playerCenterWannabe.x, wallCoord) >= PLAYER_RADIUS)
      return;
    const xTouchingTheWall =
      xMovement > 0 ? wallCoord - 2 * PLAYER_RADIUS : wallCoord;
    const rateOfChange = (xTouchingTheWall - currentPos.x) / xMovement;
    yMovement *= rateOfChange;
    xMovement = xTouchingTheWall - currentPos.x;
  }
  function placeAtHorizontalWall(wallCoord) {
    if (getDistanceToWall(playerCenterWannabe.y, wallCoord) >= PLAYER_RADIUS)
      return;
    const yTouchingTheWall =
      yMovement > 0 ? wallCoord - 2 * PLAYER_RADIUS : wallCoord;
    const rateOfChange = (yTouchingTheWall - currentPos.y) / yMovement;
    xMovement *= rateOfChange;
    yMovement = yTouchingTheWall - currentPos.y;
  }

  placeAtVerticalWall(fieldInfo.left);
  placeAtVerticalWall(fieldInfo.left + fieldInfo.width);
  placeAtHorizontalWall(fieldInfo.top);
  placeAtHorizontalWall(fieldInfo.top + fieldInfo.height);

  const wouldCollideWithOthers = obstaclesArray.some((o) => {
    const objectCenter = getCenterPoint(o.position.x, o.position.y, o.radius);
    const distanceBetweenObjects = getDistanceBetween(
      playerCenterWannabe,
      objectCenter
    );
    if (distanceBetweenObjects >= PLAYER_RADIUS + o.radius) return false; // too far away to colide

    if (xMovement !== 0)
      xMovement = xMovement > 0 ? xMovement - 1 : xMovement + 1;
    if (yMovement !== 0)
      yMovement = yMovement > 0 ? yMovement - 1 : yMovement + 1;

    return true;
  });

  return wouldCollideWithOthers && (xMovement !== 0 || yMovement !== 0)
    ? moveTheFurthestPossible(
        currentPos,
        xMovement,
        yMovement,
        obstaclesArray,
        fieldInfo
      )
    : roundPositionToDecimals({
        x: currentPos.x + xMovement,
        y: currentPos.y + yMovement,
      });
}

export function roundPositionToDecimals(position, decimals = 1) {
  return {
    x: parseFloat(Number.parseFloat(position.x).toFixed(decimals)),
    y: parseFloat(Number.parseFloat(position.y).toFixed(decimals)),
  };
}
