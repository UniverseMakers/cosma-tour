import type { TourInfoHotspot } from '../types/tour';

type InfoOverlayProps = {
  info: TourInfoHotspot | null;
  onClose: () => void;
};

function InfoOverlay({ info, onClose }: InfoOverlayProps) {
  if (!info) {
    return null;
  }

  return (
    <div className="overlay-backdrop" onClick={onClose} role="presentation">
      <section
        aria-labelledby="info-overlay-title"
        aria-modal="true"
        className="info-overlay"
        onClick={(event) => event.stopPropagation()}
        role="dialog"
      >
        <button aria-label="Close information overlay" className="overlay-close" onClick={onClose} type="button">
          Close
        </button>
        <p className="eyebrow">Information</p>
        <h2 id="info-overlay-title">{info.title}</h2>
        <p>{info.body}</p>
      </section>
    </div>
  );
}

export default InfoOverlay;
