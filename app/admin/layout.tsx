import { auth } from "../../auth";
import { redirect } from "next/navigation";

const ADMIN_EMAILS = ['0xmetamonkey@gmail.com', 'extsystudios@gmail.com', 'lifeofaman01@gmail.com'];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();

  if (!session || !session.user?.email || !ADMIN_EMAILS.includes(session.user.email)) {
    redirect("/");
  }

  return (
    <div className="min-h-screen bg-black text-white">
      {children}
    </div>
  );
}
