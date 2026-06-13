import { getAllCreators } from "../actions";
import ExploreClient from "./ExploreClient";

export const dynamic = 'force-dynamic';

export default async function ExplorePage() {
  const creators = await getAllCreators();
  return <ExploreClient initialCreators={creators} />;
}
