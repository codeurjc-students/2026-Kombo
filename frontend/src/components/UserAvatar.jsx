import { myImageUrl } from '../services/userService';

// Profile picture of the logged in user, or the initial of their name when they have none
export default function UserAvatar({ user }) {
  if (user.imageId) {
    return <img className="user-avatar" src={myImageUrl(user.imageId)} alt={`Foto de perfil de ${user.name}`} />;
  }
  return (
    <span className="user-avatar" aria-hidden="true">
      {user.name.charAt(0)}
    </span>
  );
}
