import { ControlPanel } from './components/ControlPanel';
import { EventLog } from './components/EventLog';
import { ForecastChart } from './components/ForecastChart';
import { DifficultySelect, GameOver } from './components/GameScreens';
import { HealthPanel } from './components/HealthPanel';
import { HistoryChart } from './components/HistoryChart';
import { InventoryOrders } from './components/InventoryOrders';
import { TopBar } from './components/TopBar';
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
    <div className="min-h-screen flex flex-col bg-slate-950">
      <TopBar state={state} onTogglePause={togglePause} onSetSpeed={setSpeed} />

      <main className="flex-1 flex flex-col lg:flex-row gap-3 p-3 overflow-hidden">
        <section className="flex-1 flex flex-col gap-3 min-w-0">
          <HealthPanel state={state} />
          <ForecastChart state={state} />
          <HistoryChart state={state} />
        </section>

        <ControlPanel state={state} actions={actions} />
      </main>

      <footer className="p-3 pt-0 grid grid-cols-1 lg:grid-cols-2 gap-3">
        <InventoryOrders state={state} />
        <EventLog
          notifications={state.notifications}
          onDismiss={actions.dismissNotification}
        />
      </footer>

      {state.gameOver && <GameOver state={state} onRestart={resetGame} />}
    </div>
  );
}
