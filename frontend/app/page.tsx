import { getTags } from "@/lib/db/query";
import Nav from "./ui/Nav";
import Tags from "./ui/Tags";
import Cards from "./ui/Cards";

export default async function Home() {
  const tags = await getTags()
  return (
    <div className="mx-auto h-dvh w-11/12 3xl:w-5/6">
      <Nav />
      <hr />
      <div className="p-5 flex flex-col">
        <div>
          <Tags tags={tags} />
        </div>
        <div className="mt-6 px-6">
          <Cards />
        </div>
      </div>
    </div>
  );
}