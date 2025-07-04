// components/DynamicAvatar.jsx
import Image from 'next/image';

const DynamicAvatar = ({ seed = Math.random().toString(36).substring(2), imageUrl = null }) => {
  // Si une URL d'image est fournie, l'utiliser. Sinon, générer un avatar de secours.
  const finalImageUrl = imageUrl || `https://api.dicebear.com/7.x/identicon/png?seed=${seed}`;

  return (
    <Image
      src={finalImageUrl}
      alt="User avatar"
      width={100}
      height={100}
      className="rounded-full w-full h-full object-cover" // Assure que l'image remplit le conteneur
      priority={false} // Avoid priority on avatars that are not critical
    />
  );
}

export default DynamicAvatar;
