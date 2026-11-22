import { myImageUrl } from '../services/userService';

// Profile picture of a user, or the initial of their name when they have none. imageUrl gives the URL of the
// picture: the one of the logged in user by default, or the one of any user for the administrator.
export default function UserAvatar({ user, imageUrl }) {
  if (user.imageId) {
    const src = imageUrl ? imageUrl(user.imageId) : myImageUrl(user.imageId);
    return <img className="user-avatar" src={src} alt={`Foto de perfil de ${user.name}`} />;
  }
  return (
    <span className="user-avatar" aria-hidden="true">
      {user.name.charAt(0)}
    </span>
  );
}
