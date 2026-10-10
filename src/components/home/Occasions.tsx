import Link from "next/link";
import Icon, { type IconName } from "@/components/Icon";

const occasions: { name: string; blurb: string; icon: IconName }[] = [
  { name: "Birthday", blurb: "From first birthdays to milestone ones.", icon: "birthday-cake" },
  { name: "Wedding", blurb: "Elegant tiers for your big day.", icon: "ring" },
  { name: "Anniversary", blurb: "Something sweet for two.", icon: "heart" },
  { name: "Celebration", blurb: "Festivals, parties and surprises.", icon: "cheers" },
];

export default function Occasions() {
  return (
    <div className="lx-occasion-grid">
      {occasions.map((o, i) => (
        <Link
          key={o.name}
          href={`/special-order/?occasion=${encodeURIComponent(o.name)}`}
          className="lx-occasion"
          data-reveal=""
          style={{ "--i": i } as React.CSSProperties}
        >
          <span className="lx-occasion-icon"><Icon name={o.icon} /></span>
          <span className="lx-occasion-name">{o.name} Cakes</span>
          <span className="lx-occasion-blurb">{o.blurb}</span>
          <span className="lx-occasion-go">Design yours <Icon name="arrow-right" /></span>
        </Link>
      ))}
    </div>
  );
}
