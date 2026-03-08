import { currentUser } from "@clerk/nextjs/server";
import Demo2Client from "./Demo2Client";

export default async function Demo2Page() {
  const user = await currentUser();
  return <Demo2Client />;
}
