import { mediaUrl } from '../shared/api';
import { avatarTone, initials } from '../shared/format';

export function Avatar({ name = '', src, size = '', className = '' }) {
  const tone = avatarTone(name);
  return (
    <span className={`avatar ${tone} ${size} ${className}`.trim()} aria-hidden="true">
      {src ? <img src={mediaUrl(src)} alt="" loading="lazy" /> : initials(name)}
    </span>
  );
}
