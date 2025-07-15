

interface BulkActionsBarProps {
  selectedCount: number;
  onDelete: () => void;
  onFeature: () => void;
  onUnfeature: () => void;
  onSetOnSale: () => void;
  onRemoveFromSale: () => void;
  onAddCredit: () => void;
}

const BulkActionsBar: React.FC<BulkActionsBarProps> = ({
  selectedCount,
  onDelete,
  onFeature,
  onUnfeature,
  onSetOnSale,
  onRemoveFromSale,
  onAddCredit
}) => {
  return (
    <div className="bulk-actions-bar">
      <div className="bulk-actions-count">
        <span>{selectedCount} product(s) selected</span>
      </div>
      <div className="bulk-actions-buttons">
        <button className="bulk-action-btn bulk-action-btn--credit" onClick={onAddCredit}>
          <span className="bulk-action-icon credit-icon"></span>
          Add Credit
        </button>
        <button className="bulk-action-btn bulk-action-btn--feature" onClick={onFeature}>
          <span className="bulk-action-icon feature-icon"></span>
          Feature
        </button>
        <button className="bulk-action-btn bulk-action-btn--unfeature" onClick={onUnfeature}>
          <span className="bulk-action-icon unfeature-icon"></span>
          Unfeature
        </button>
        <button className="bulk-action-btn bulk-action-btn--sale" onClick={onSetOnSale}>
          <span className="bulk-action-icon sale-icon"></span>
          Set On Sale
        </button>
        <button className="bulk-action-btn bulk-action-btn--remove-sale" onClick={onRemoveFromSale}>
          <span className="bulk-action-icon remove-sale-icon"></span>
          Remove Sale
        </button>
        <button className="bulk-action-btn bulk-action-btn--delete" onClick={onDelete}>
          <span className="bulk-action-icon delete-icon"></span>
          Delete
        </button>
      </div>
    </div>
  );
};

export default BulkActionsBar;