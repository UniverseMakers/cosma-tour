import { useCallback, useEffect, useMemo, useState } from 'react';
import InfoOverlay from './components/InfoOverlay';
import PanoramaViewer from './components/PanoramaViewer';
import { loadTour } from './config/loadTour';
import type { LoadedTourConfig, TourInfoHotspot } from './types/tour';

type LoadState = 'loading' | 'ready' | 'error';

function App() {
  const [status, setStatus] = useState<LoadState>('loading');
  const [tour, setTour] = useState<LoadedTourConfig | null>(null);
  const [currentSceneId, setCurrentSceneId] = useState<string>('');
  const [activeInfo, setActiveInfo] = useState<TourInfoHotspot | null>(null);
  const [errorMessage, setErrorMessage] = useState<string>('');

  useEffect(() => {
    let cancelled = false;

    setStatus('loading');
    setErrorMessage('');

    loadTour()
      .then((loadedTour) => {
        if (cancelled) {
          return;
        }

        setTour(loadedTour);
        setCurrentSceneId(loadedTour.startSceneId);
        setStatus('ready');
      })
      .catch((error: unknown) => {
        if (cancelled) {
          return;
        }

        const message = error instanceof Error ? error.message : 'Failed to load tour configuration.';
        setErrorMessage(message);
        setStatus('error');
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const currentScene = useMemo(
    () => tour?.scenes.find((scene) => scene.id === currentSceneId) ?? null,
    [currentSceneId, tour],
  );

  const handleNavigate = useCallback((sceneId: string) => {
    setActiveInfo(null);
    setCurrentSceneId(sceneId);
  }, []);

  const handleOpenInfo = useCallback((info: TourInfoHotspot) => {
    setActiveInfo(info);
  }, []);

  return (
    <div className="app-shell">
      <div className="app-chrome">
        <div className="panel">
          <p className="eyebrow">COSMA Tour</p>
          <h1>{tour?.title ?? 'Room Explorer'}</h1>
          <p>{currentScene?.title ?? 'Loading panorama scenes...'}</p>
        </div>
        <div className="panel help-panel">
          <p>Drag to look around.</p>
          <p>Use {'>'} hotspots to move and i hotspots to open information.</p>
        </div>
      </div>

      {status === 'loading' && (
        <div className="status-screen" role="status" aria-live="polite">
          <h2>Loading room tour...</h2>
          <p>Fetching YAML configuration and panorama assets.</p>
        </div>
      )}

      {status === 'error' && (
        <div className="status-screen" role="alert">
          <h2>Unable to load the tour</h2>
          <p>{errorMessage}</p>
        </div>
      )}

      {status === 'ready' && tour && currentSceneId && (
        <PanoramaViewer
          currentSceneId={currentSceneId}
          tour={tour}
          onNavigate={handleNavigate}
          onOpenInfo={handleOpenInfo}
        />
      )}

      {tour && tour.warnings.length > 0 && (
        <aside className="warning-panel" aria-live="polite">
          <strong>Config warnings</strong>
          <ul>
            {tour.warnings.map((warning) => (
              <li key={warning}>{warning}</li>
            ))}
          </ul>
        </aside>
      )}

      <InfoOverlay info={activeInfo} onClose={() => setActiveInfo(null)} />
    </div>
  );
}

export default App;
