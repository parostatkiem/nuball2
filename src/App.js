import React, { useEffect, useState } from "react";
import "./App.scss";
import { PubNubContext } from "./contexts/pubnub";
import Match from "./views/Match";

function App() {
  // const nick = prompt("Please enter your name");
  const [nick, setNick] = useState();
  useEffect(() => {
    setNick(prompt("Please enter your nickname"));
  }, []);

  const pubNubInstance = new window.PubNub({
    publishKey: "pub-c-c27fb031-38a4-4470-8c23-64d7cf18e9f1",
    subscribeKey: "sub-c-f1413f4c-0c92-11ec-9c1c-9adb7f1f2877",
    uuid: nick,
  });

  return (
    <main style={{ backgroundImage: `url(/bg.jpg)` }}>
      <div id="pubnub-logo">
        PubNub
        <div id="bg"></div>
      </div>
      <PubNubContext.Provider value={pubNubInstance}>
        {pubNubInstance && <Match />}
      </PubNubContext.Provider>
    </main>
  );
}

export default App;
