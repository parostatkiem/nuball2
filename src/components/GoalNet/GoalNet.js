import React from "react";

import "./GoalNet.scss";

const NET_WIDTH = 60;

const GoalNet = ({
  fieldInfo,
  isRightSided = false,
  height,
  top,
  points = 0,
}) => {
  return (
    <div
      style={{
        width: NET_WIDTH + "px",
        height: height + "px",
        top: top + "px",
        left: isRightSided
          ? fieldInfo.left + fieldInfo.width
          : fieldInfo.left - NET_WIDTH,
        transform: isRightSided ? "scale(-1,1)" : "none",
      }}
      className={`goal-net ${isRightSided ? "right" : ""}`}
    >
      <span>{points}</span>
    </div>
  );
};

export default GoalNet;
