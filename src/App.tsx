import TimeAgo from "timeago-react";
import "./App.scss";
import Big from "big.js";

import { useEffect, useState } from "react";

import { bigToString } from "./data/utils";
import { SocketEvent } from "./schema/socket_event";
import { UsnEvent } from "./schema/usn_event";
import SocialAccount from "./components/social_account/SocialAccount";

let globalIndex = 0;

const usnMintAndBurnFilter = [
  {
    status: "SUCCESS",
    account_id: "usn",
    event: {
      standard: "nep141",
      event: "ft_mint",
    },
  },
  {
    status: "SUCCESS",
    account_id: "usn",
    event: {
      standard: "nep141",
      event: "ft_burn",
    },
  },
];

let reconnectTimeout: NodeJS.Timeout | null = null;

function listenToUsn(processEvents: (socketEvents: SocketEvent[]) => void) {
  const scheduleReconnect = (timeOut: number) => {
    if (reconnectTimeout) {
      clearTimeout(reconnectTimeout);
      reconnectTimeout = null;
    }
    reconnectTimeout = setTimeout(() => {
      listenToUsn(processEvents);
    }, timeOut);
  };

  if (document.hidden) {
    scheduleReconnect(1000);
    return;
  }

  const ws = new WebSocket("wss://events.near.stream/ws");

  ws.onopen = () => {
    console.log(`Connection to WS has been established`);
    ws.send(
      JSON.stringify({
        secret: "usn",
        filter: usnMintAndBurnFilter,
        fetch_past_events: 50,
      })
    );
  };
  ws.onclose = () => {
    console.log(`WS Connection has been closed`);
    scheduleReconnect(1);
  };
  ws.onmessage = (e) => {
    const socketEvents: SocketEvent[] = JSON.parse(e.data).events;
    processEvents(socketEvents);
  };
  ws.onerror = (err) => {
    console.log("WebSocket error", err);
  };
}

// to support batch mint / burn, we process every event data
function processEvent(event: SocketEvent): UsnEvent[] {
  const usnEvents: UsnEvent[] = [];
  event.event.data.forEach((singleEventData) => {
    usnEvents.push({
      time: new Date(parseFloat(event.block_timestamp) / 1e6),
      event: event.event.event.substring(3), // remove the ft_ to only display mint / burn
      index: globalIndex++,
      owner_id: singleEventData.owner_id,
      amount: singleEventData.amount,
    });
  });
  return usnEvents;
}

function App() {
  const [usnEvents, setUsnEvents] = useState<UsnEvent[]>([]);

  // Setting up NFTs
  useEffect(() => {
    const processEvents = (socketEvents: SocketEvent[]) => {
      // console.log(events);
      const usnEvents = socketEvents.flatMap(processEvent);
      usnEvents.reverse();
      setUsnEvents((prevState) => {
        const newUsnEvents = [
          ...usnEvents.filter(
            (usnEvent: UsnEvent) =>
              prevState.length === 0 ||
              usnEvent.time.getTime() > prevState[0].time.getTime()
          ),
          ...prevState,
        ];
        return newUsnEvents.slice(0, 100);
      });
    };

    listenToUsn(processEvents);
  }, []);

  return (
    <div className="container">
      <h1>Live USN feed</h1>
      {/* add filter by amount, like only display event greater than x USD */}
      <div className="table-responsive">
        <table className="table align-middle">
          <tbody>
            {usnEvents.map((usnEvent) => {
              return (
                <tr key={usnEvent.index}>
                  <td className="col-1">
                    <TimeAgo datetime={usnEvent.time} />
                  </td>
                  <td className="col-3">
                    <SocialAccount accountId={usnEvent.owner_id} clickable />
                  </td>
                  <td className="col-3">{usnEvent.event}</td>
                  <td className="col-1 text-end">
                    {bigToString(Big(usnEvent.amount).div(Big(10).pow(18)))} USN
                  </td>
                  {/* TODO: add spend / receive how much near */}
                  {/* TODO: add exchange rate, like 1 near = 3.x usn */}
                  {/* TODO: add explore link */}
                  {/* TODO: add whale alert symbol if amount > x */}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default App;
