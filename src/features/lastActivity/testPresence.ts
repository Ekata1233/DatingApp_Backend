import "dotenv/config";
import {
  setUserOnline,
  setUserOffline,
  updateHeartbeat,
  getUsersPresence,
} from "./lastActivity.service";

async function test() {
  const userId = "user123";

 await setUserOnline("user123");

console.log("Waiting 130 sec...");
await new Promise(r => setTimeout(r, 130000));

const result = await getUsersPresence(["user123"]);
console.log(result);

}

test();
