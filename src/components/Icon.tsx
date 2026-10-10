import type { CSSProperties, ComponentType } from "react";
import {
  FaArrowRight, FaArrowUp, FaCheck, FaChevronDown, FaCommentDots, FaCopy, FaGlassCheers, FaHeart, FaLeaf,
  FaPalette, FaQuoteLeft, FaRing, FaSearch, FaStar, FaStore, FaTruck, FaYoutube,
  FaBalanceScale, FaBars, FaBirthdayCake, FaCamera, FaCheckCircle, FaChevronLeft, FaChevronRight,
  FaClock, FaCreditCard, FaEnvelope, FaExclamationTriangle, FaFacebookF, FaGoogle, FaInfoCircle,
  FaInstagram, FaMapMarkerAlt, FaMinus, FaMobileAlt, FaPaperPlane, FaPhone, FaPinterest, FaPlus,
  FaQrcode, FaShoppingBag, FaShoppingBasket, FaShoppingCart, FaSyncAlt, FaTag, FaTimes, FaTrash,
  FaUsers, FaWhatsapp,
} from "react-icons/fa";

const icons = {
  "arrow-right": FaArrowRight,
  "arrow-up": FaArrowUp,
  check: FaCheck,
  "chevron-down": FaChevronDown,
  comment: FaCommentDots,
  copy: FaCopy,
  cheers: FaGlassCheers,
  heart: FaHeart,
  leaf: FaLeaf,
  palette: FaPalette,
  quote: FaQuoteLeft,
  ring: FaRing,
  search: FaSearch,
  star: FaStar,
  store: FaStore,
  truck: FaTruck,
  youtube: FaYoutube,
  "balance-scale": FaBalanceScale,
  bars: FaBars,
  "birthday-cake": FaBirthdayCake,
  camera: FaCamera,
  "check-circle": FaCheckCircle,
  "chevron-left": FaChevronLeft,
  "chevron-right": FaChevronRight,
  "clock-o": FaClock,
  "credit-card": FaCreditCard,
  envelope: FaEnvelope,
  "exclamation-triangle": FaExclamationTriangle,
  facebook: FaFacebookF,
  google: FaGoogle,
  "info-circle": FaInfoCircle,
  instagram: FaInstagram,
  "map-marker": FaMapMarkerAlt,
  minus: FaMinus,
  mobile: FaMobileAlt,
  "paper-plane": FaPaperPlane,
  phone: FaPhone,
  pinterest: FaPinterest,
  plus: FaPlus,
  qrcode: FaQrcode,
  refresh: FaSyncAlt,
  "shopping-bag": FaShoppingBag,
  "shopping-basket": FaShoppingBasket,
  "shopping-cart": FaShoppingCart,
  tag: FaTag,
  times: FaTimes,
  trash: FaTrash,
  users: FaUsers,
  whatsapp: FaWhatsapp,
} satisfies Record<string, ComponentType>;

export type IconName = keyof typeof icons;

/** Inline SVG icon. Renders inside an <i> so the site's existing `... i { ... }` CSS still applies. */
export default function Icon({ name, style, className }: { name: IconName; style?: CSSProperties; className?: string }) {
  const Svg = icons[name];
  return (
    <i className={className ? `fa ${className}` : "fa"} aria-hidden="true" style={style}>
      <Svg />
    </i>
  );
}
