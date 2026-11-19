interface Props {
  className?: string;
  linkClassName?: string;
}

/** The credit every game app carries in its footer (not the dicejar.games landing page itself). */
export const DiceJarCredit = ({ className, linkClassName }: Props) => (
  <span className={className}>
    Another app pulled from the{' '}
    <a className={linkClassName} href="https://dicejar.games">
      Dice Jar
    </a>
  </span>
);
