import type { ReactNode } from "react";

type ContainerProps = {
	children: ReactNode;
	size?: "default" | "wide";
};

export default function Container({ children, size = "default" }: ContainerProps) {
	const baseClass =
		size === "wide"
			? "mx-auto w-full max-w-[110rem] px-4 sm:px-6 lg:px-12 xl:px-16"
			: "mx-auto max-w-7xl px-4 sm:px-6 lg:px-8";

	return <div className={baseClass}>{children}</div>;
}
