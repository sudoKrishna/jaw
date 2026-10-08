import GameCanvas from "@/component/GameCanvas";



export default function Home() {
  return (
    <main
      style={{
        width: "100%",
        height: "100dvh",
        overflow: "hidden",
      }}
    >
      <GameCanvas />
    </main>
  );
}