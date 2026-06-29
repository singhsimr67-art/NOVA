/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface UrgencyBadgeInfo {
  label: 'STABLE' | 'HEAVY HORIZON' | 'EXTREME DANGER';
  colorClass: string; // text color
  bgClass: string;    // background color
  borderClass: string;// border color
  shadowClass: string;// shadow class for dangerous zone
}

/**
 * Computes the urgency tier and styling for a given urgency score.
 * Color coding: score < 3 (green), 3-6 (amber), 6+ (red)
 * Label: "STABLE", "HEAVY HORIZON", "EXTREME DANGER"
 */
export function getUrgencyBadge(score: number): UrgencyBadgeInfo {
  if (score >= 6.0) {
    return {
      label: 'EXTREME DANGER',
      colorClass: 'text-rose-400',
      bgClass: 'bg-rose-500/10',
      borderClass: 'border-rose-500/30',
      shadowClass: 'shadow-[0_0_12px_rgba(239,68,68,0.15)]'
    };
  } else if (score >= 3.0) {
    return {
      label: 'HEAVY HORIZON',
      colorClass: 'text-amber-400',
      bgClass: 'bg-amber-500/10',
      borderClass: 'border-amber-500/25',
      shadowClass: ''
    };
  } else {
    return {
      label: 'STABLE',
      colorClass: 'text-emerald-400',
      bgClass: 'bg-emerald-500/10',
      borderClass: 'border-emerald-500/20',
      shadowClass: ''
    };
  }
}
