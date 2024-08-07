import { getTags } from "@/lib/db/query";
import Nav from "./ui/Nav";
import VideoUpload from "./ui/VideoUpload";

export default async function Home() {
  const tags = await getTags()
  return (
    <div className="mx-auto h-dvh w-11/12 3xl:w-2/3">
      <Nav />
      <hr />
      <div className="p-5">
        {/* <Tags tags={tags} /> */}
      </div>
      <VideoUpload tags={tags} />
    </div>
  );
}