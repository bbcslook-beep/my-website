if (!process.env.npm_config_user_agent?.startsWith("pnpm/")) {
	console.error(
		"Use the pnpm version specified in package.json to install dependencies.",
	);
	process.exit(1);
}
