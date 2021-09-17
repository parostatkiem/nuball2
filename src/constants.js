//PLAYER
export const PLAYER_RADIUS = 20;

export const KEY_UP = 87;
export const KEY_DOWN = 83;
export const KEY_LEFT = 65;
export const KEY_RIGHT = 68;

export const KEY_KICK = 32;
export const KEY_RESTART = "r";
export const KEY_SHUFFLE = "t";
export const KEY_RESET_POINTS = "y";

export const CONTROL_REFRESH_RATE = 30; //ms
export const MOVE_AMOUNT_PER_REFRESH = 8; //px
export const DEFAULT_POSITION_YELLOW = (fieldInfo, yOffset = 0) => ({
  x: fieldInfo.left + 10,
  y: fieldInfo.top + fieldInfo.height / 2 + yOffset,
});
export const DEFAULT_POSITION_BLUE = (fieldInfo, yOffset = 0) => ({
  x: fieldInfo.left + fieldInfo.width - 10 - 2 * PLAYER_RADIUS,
  y: fieldInfo.top + fieldInfo.height / 2 + yOffset,
});

//BALL
export const BALL_RADIUS = 18;
export const BALL_REFRESH_RATE = 50;
export const BALL_TOUCH_SPEED = 0.09;
export const BALL_KICK_SPEED = 0.34;
export const BALL_SLOWDOWN_RATE = 0.0011;
export const DEFAULT_BALL_POSITION = (fieldInfo) => ({
  x: fieldInfo.left + fieldInfo.width / 2 - BALL_RADIUS,
  y: fieldInfo.top + fieldInfo.height / 2 - BALL_RADIUS,
});
