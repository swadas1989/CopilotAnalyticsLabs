import { makeStyles, mergeClasses, shorthands, tokens } from "@fluentui/react-components";
import {
  ThumbLike16Regular,
  ThumbLike16Filled,
  ThumbDislike16Regular,
  ThumbDislike16Filled,
} from "@fluentui/react-icons";
import { useCardVotes } from "./votes";

const useStyles = makeStyles({
  root: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    marginTop: "12px",
  },
  button: {
    display: "inline-flex",
    alignItems: "center",
    gap: "4px",
    ...shorthands.padding("4px", "8px"),
    ...shorthands.border("1px", "solid", "#e0e0e0"),
    ...shorthands.borderRadius("14px"),
    backgroundColor: "#ffffff",
    color: "#424242",
    fontFamily: "inherit",
    fontSize: "12px",
    lineHeight: "16px",
    fontWeight: 600,
    cursor: "pointer",
    transitionProperty: "background-color, border-color, color",
    transitionDuration: "120ms",
    ":hover": {
      backgroundColor: "#f5f5f5",
      ...shorthands.borderColor("#c7c7c7"),
    },
    ":focus-visible": {
      outlineWidth: "2px",
      outlineStyle: "solid",
      outlineColor: tokens.colorBrandStroke1,
      outlineOffset: "1px",
    },
  },
  up: {
    ...shorthands.borderColor("#9bd4a6"),
    backgroundColor: "#eef8f0",
    color: "#0e700e",
  },
  down: {
    ...shorthands.borderColor("#eab7b7"),
    backgroundColor: "#fdf0f0",
    color: "#b10e1c",
  },
  count: {
    minWidth: "8px",
    textAlign: "center",
    fontVariantNumeric: "tabular-nums",
  },
});

interface VoteBarProps {
  cardId: string;
  className?: string;
}

export function VoteBar({ cardId, className }: VoteBarProps) {
  const styles = useStyles();
  const { counts, myVote, vote, pending } = useCardVotes(cardId);

  return (
    <div className={mergeClasses(styles.root, className)} role="group" aria-label="Was this helpful?">
      <button
        type="button"
        className={mergeClasses(styles.button, myVote === "up" && styles.up)}
        aria-pressed={myVote === "up"}
        aria-label={`Thumbs up. ${counts.up} ${counts.up === 1 ? "vote" : "votes"}`}
        disabled={pending}
        onClick={() => vote("up")}
      >
        {myVote === "up" ? <ThumbLike16Filled fontSize={16} /> : <ThumbLike16Regular fontSize={16} />}
        <span className={styles.count}>{counts.up}</span>
      </button>
      <button
        type="button"
        className={mergeClasses(styles.button, myVote === "down" && styles.down)}
        aria-pressed={myVote === "down"}
        aria-label={`Thumbs down. ${counts.down} ${counts.down === 1 ? "vote" : "votes"}`}
        disabled={pending}
        onClick={() => vote("down")}
      >
        {myVote === "down" ? (
          <ThumbDislike16Filled fontSize={16} />
        ) : (
          <ThumbDislike16Regular fontSize={16} />
        )}
        <span className={styles.count}>{counts.down}</span>
      </button>
    </div>
  );
}
