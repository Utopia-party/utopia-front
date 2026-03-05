import { useParams } from "react-router";

export default function Profile() {
  const { userId } = useParams();
  return (
    <div>
      <h1>Profile Page</h1>
      <p>ID: {userId}</p>
    </div>
  );
}
