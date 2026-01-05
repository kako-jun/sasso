import styles from './AttackIndicator.module.css';

interface AttackIndicatorProps {
  isUnderAttack: boolean;
}

/**
 * Visual indicator for incoming attack.
 * Overlays a grid pattern on the prediction area when attacked.
 */
export function AttackIndicator({ isUnderAttack }: AttackIndicatorProps) {
  if (!isUnderAttack) return null;

  return (
    <div className={styles.attackIndicator}>
      <svg className={styles.attackGrid} viewBox="0 0 100 100" preserveAspectRatio="none">
        {/* Vertical lines */}
        {[20, 40, 60, 80].map((x) => (
          <line key={`v${x}`} x1={x} y1={0} x2={x} y2={100} stroke="#666" strokeWidth="2" />
        ))}
        {/* Horizontal lines */}
        {[25, 50, 75].map((y) => (
          <line key={`h${y}`} x1={0} y1={y} x2={100} y2={y} stroke="#666" strokeWidth="2" />
        ))}
      </svg>
      <div className={styles.attackLabel}>ATTACK!</div>
    </div>
  );
}
