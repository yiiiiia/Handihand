import Cards from "./ui/Cards";
import Nav from "./ui/Nav";
import Tags from "./ui/Tags";

export default async function Home() {
  return (
    <div className="mx-auto h-dvh w-11/12 3xl:w-5/6">
      <Nav />
      <hr />
      <div className="p-5 flex flex-col">
        <Tags />
        <div className="mt-6 px-6">
          <Cards />
        </div>
      </div>
    </div>
  );
}