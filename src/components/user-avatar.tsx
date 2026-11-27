import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

type UserAvatarProps = {
  displayName: string;
  avatarUrl: string | null;
  size?: "default" | "sm" | "lg";
  className?: string;
};

function initialsOf(displayName: string): string {
  return displayName
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase())
    .join("");
}

export function UserAvatar({
  displayName,
  avatarUrl,
  size,
  className,
}: UserAvatarProps) {
  return (
    <Avatar size={size} className={className}>
      {avatarUrl && <AvatarImage src={avatarUrl} alt="" />}
      <AvatarFallback>{initialsOf(displayName)}</AvatarFallback>
    </Avatar>
  );
}
