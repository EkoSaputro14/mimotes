import { DefaultSession } from "next-auth";
import { DefaultJWT } from "next-auth/jwt";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
      selectedWorkspaceId?: string;
    };
  }

  interface User {
    id: string;
    selectedWorkspaceId?: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT extends DefaultJWT {
    id: string;
    selectedWorkspaceId?: string;
  }
}
