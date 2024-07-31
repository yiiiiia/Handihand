import { getAllTags } from "@/lib/db/query";
import Nav from "./ui/Nav";
import Tags from "./ui/Tags";

export default async function Home() {
  const allTags = await getAllTags()
  return (
    <div className="h-full w-screen">
      <Nav />
      <hr />
      <div className="p-5">
        <Tags tags={allTags} />
      </div>
    </div>
  );
}