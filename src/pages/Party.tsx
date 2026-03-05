import { useParams } from "react-router";

export default function Party() {
  const partyId = useParams();

  return (
    <div>
      <h1>Party Page</h1>
      <p>{`PartyId: ${partyId}`}</p>
    </div>
  );
}
