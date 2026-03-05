import { Link, Outlet } from "react-router";

function App() {
  return (
    <>
      <h1>App Component</h1>
      <ul className="flex space-x-4 text-primary">
        <Link to={"/"}>Home</Link>
        <Link to={"/login"}>Login</Link>
      </ul>
      <Outlet />
    </>
  );
}

export default App;
