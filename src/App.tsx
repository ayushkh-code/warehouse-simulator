import { BulletinBoard } from './components/BulletinBoard';
import { ControlPanel } from './components/ControlPanel';
import { ForecastChart } from './components/ForecastChart';
import { DifficultySelect, GameOver } from './components/GameScreens';
import { HealthPanel } from './components/HealthPanel';
import { HistoryChart } from './components/HistoryChart';
import { InventoryOrders } from './components/InventoryOrders';
import { TopBar } from './components/TopBar';
import { WeekTicker } from './components/WeekTicker';
import { useGame } from './hooks/useGame';

export default function App() {
  const {
    state,
    showDifficulty,
    startGame,
    resetGame,
    togglePause,
    setSpeed,
    actions,
  } = useGame();

  if (showDifficulty) {
    return <DifficultySelect onSelect={startGame} />;
  }

  return (
    <div className="min-h-screen flex flex-col game-shell">
      <TopBar state={state} onTogglePause={togglePause} onSetSpeed={setSpeed} />
      <WeekTicker state={state} />
      <BulletinBoard state={state} onDismiss={actions.dismissNotification} />

      <main className="flex-1 flex flex-col lg:flex-row gap-3 p-3 overflow-hidden">
        <section className="flex-1 flex flex-col gap-3 min-w-0">
          <HealthPanel state={state} />
          <ForecastChart state={state} />
          <HistoryChart state={state} />
        </section>

        <ControlPanel state={state} actions={actions} />
      </main>

      <footer className="p-3 pt-0">
        <InventoryOrders state={state} />
      </footer>

      {state.gameOver && <GameOver state={state} onRestart={resetGame} />}
    </div>
  );
}
