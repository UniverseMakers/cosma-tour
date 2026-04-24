import { useCallback, useEffect, useMemo, useState } from 'react';
import InfoOverlay from './components/InfoOverlay';
import PanoramaViewer from './components/PanoramaViewer';
import { loadTour } from './config/loadTour';
import type { LoadedTourConfig, TourInfoHotspot } from './types/tour';

/**
 * Minimal app state machine for the asynchronous tour bootstrap process.
 */
type LoadState = 'loading' | 'ready' | 'error';

/**
 * Top-level application shell.
 *
 * Responsibilities:
 * - fetch and validate the YAML tour definition
 * - select the initial start scene
 * - track the currently active scene id
 * - track the currently open info overlay
 * - render loading and error states around the viewer
 *
 * @returns The complete application shell including viewer, overlays, and
 * status panels.
 */
function App() {
  const [status, setStatus] = useState<LoadState>('loading');
  const [tour, setTour] = useState<LoadedTourConfig | null>(null);
  const [currentSceneId, setCurrentSceneId] = useState<string>('');
  const [activeInfo, setActiveInfo] = useState<TourInfoHotspot | null>(null);
  const [errorMessage, setErrorMessage] = useState<string>('');

  useEffect(() => {
    // Guard against setting state if the component unmounts before the fetch
    // and YAML parse complete.
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

  /**
   * Close any open info card when moving between scenes so the overlay never
   * becomes detached from the panorama it came from.
   *
   * @param sceneId The id of the scene that should become active.
   * @returns Nothing.
   */
  const handleNavigate = useCallback((sceneId: string) => {
    setActiveInfo(null);
    setCurrentSceneId(sceneId);
  }, []);

  /**
   * Store the selected info hotspot so the overlay can render its content.
   *
   * @param info The hotspot content to display in the overlay.
   * @returns Nothing.
   */
  const handleOpenInfo = useCallback((info: TourInfoHotspot) => {
    setActiveInfo(info);
  }, []);

  return (
    <div className="app-shell">
      <div className="app-chrome">
        <div className="panel title-panel">
          <p className="eyebrow">COSMA Tour</p>
          <h1>{tour?.title ?? 'Room Explorer'}</h1>
          <p>{currentScene?.title ?? 'Loading panorama scenes...'}</p>
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
