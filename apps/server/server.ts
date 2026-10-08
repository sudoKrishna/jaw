import { WebSocketServer } from "ws";

const wss = new WebSocketServer({
port : 8080,
});

console.log("Websocket server running port 8080")


wss.on("connection", (ws) => {
    console.log("A player connected")

    ws.on("message", (data) => {
        console.log("Message received:", data.toString());
    });

    ws.on("close", () => {
        console.log("A player disconnected")
    })
})