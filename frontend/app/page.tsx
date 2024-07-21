import Nav from "./ui/Nav";
import Uploader from "./ui/Uploader";

export default function Home() {
  return (
    <>
      <Nav />
      <section className="flex flex-col items-center justify-between p-24">
        <Uploader />
      </section>
    </>
  );
}
