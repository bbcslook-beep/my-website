import type {
	ExpressiveCodeConfig,
	LicenseConfig,
	NavBarConfig,
	ProfileConfig,
	SiteConfig,
} from "./types/config";
import { LinkPreset } from "./types/config";

export const siteConfig: SiteConfig = {
<<<<<<< HEAD
	title: "ChronoHex",
	subtitle: "BBCSLOOK的个人博客",
	lang: "zh_CN", // Language code, e.g. 'en', 'zh_CN', 'ja', etc.
=======
	title: "Fuwari",
	subtitle: "Demo Site",
	lang: "en", // Language code, e.g. 'en', 'zh_CN', 'ja', etc.
>>>>>>> upstream/main
	themeColor: {
		hue: 250, // Default hue for the theme color, from 0 to 360. e.g. red: 0, teal: 200, cyan: 250, pink: 345
		fixed: false, // Hide the theme color picker for visitors
	},
	banner: {
		enable: false,
		src: "assets/images/demo-banner.png", // Relative to the /src directory. Relative to the /public directory if it starts with '/'
		position: "center", // Equivalent to object-position, only supports 'top', 'center', 'bottom'. 'center' by default
		credit: {
			enable: false, // Display the credit text of the banner image
			text: "", // Credit text to be displayed
			url: "", // (Optional) URL link to the original artwork or artist's page
		},
	},
	toc: {
		enable: true, // Display the table of contents on the right side of the post
		depth: 2, // Maximum heading depth to show in the table, from 1 to 3
	},
	favicon: [
		// Leave this array empty to use the default favicon
<<<<<<< HEAD
		{
			src: "/favicon/favicon-light-596.png", // Path of the favicon, relative to the /public directory
			theme: "light", // (Optional) Either 'light' or 'dark', set only if you have different favicons for light and dark mode
			//   sizes: '32x32',              // (Optional) Size of the favicon, set only if you have favicons of different sizes
		},
		{
			src: "/favicon/favicon-dark-474.png",
			theme: "dark",
		},
=======
		// {
		//   src: '/favicon/icon.png',    // Path of the favicon, relative to the /public directory
		//   theme: 'light',              // (Optional) Either 'light' or 'dark', set only if you have different favicons for light and dark mode
		//   sizes: '32x32',              // (Optional) Size of the favicon, set only if you have favicons of different sizes
		// }
>>>>>>> upstream/main
	],
};

export const navBarConfig: NavBarConfig = {
	links: [
		LinkPreset.Home,
		LinkPreset.Archive,
		LinkPreset.About,
		{
<<<<<<< HEAD
			name: "门户站点",
			url: "https://sdgo.072145.xyz", // Internal links should not include the base path, as it is automatically added
			external: true, // Show an external link icon and will open in a new tab
		},
		{
			name: "统计", // 导航栏显示的文字
			url: "http://umami.072145.xyz/share/Ejc1r4BcnolCdhw8",
			external: true, // true 代表在新标签页打开 (推荐，防止用户离开你的博客)
		},
		{
			name: "状态", // 导航栏显示的文字
			url: "https://stats.uptimerobot.com/eUvCSmHipt",
			external: true, // true 代表在新标签页打开 (推荐，防止用户离开你的博客)
		},
=======
			name: "GitHub",
			url: "https://github.com/saicaca/fuwari", // Internal links should not include the base path, as it is automatically added
			external: true, // Show an external link icon and will open in a new tab
		},
>>>>>>> upstream/main
	],
};

export const profileConfig: ProfileConfig = {
<<<<<<< HEAD
	avatar: "https://q2.qlogo.cn/headimg_dl?dst_uin=3153364829&spec=640", // Relative to the /src directory. Relative to the /public directory if it starts with '/'
	name: "BBCSLOOK",
	bio: "闲来无事整点活 \n 喜欢折腾各种零七杂八",
	links: [
		{
			name: "Bilibili",
			icon: "fa6-brands:bilibili",
			url: "https://space.bilibili.com/510018210",
=======
	avatar: "assets/images/demo-avatar.png", // Relative to the /src directory. Relative to the /public directory if it starts with '/'
	name: "Lorem Ipsum",
	bio: "Lorem ipsum dolor sit amet, consectetur adipiscing elit.",
	links: [
		{
			name: "Twitter",
			icon: "fa6-brands:twitter", // Visit https://icones.js.org/ for icon codes
			// You will need to install the corresponding icon set if it's not already included
			// `pnpm add @iconify-json/<icon-set-name>`
			url: "https://twitter.com",
		},
		{
			name: "Steam",
			icon: "fa6-brands:steam",
			url: "https://store.steampowered.com",
>>>>>>> upstream/main
		},
		{
			name: "GitHub",
			icon: "fa6-brands:github",
<<<<<<< HEAD
			url: "https://github.com/bbcslook-beep",
=======
			url: "https://github.com/saicaca/fuwari",
>>>>>>> upstream/main
		},
	],
};

export const licenseConfig: LicenseConfig = {
	enable: true,
	name: "CC BY-NC-SA 4.0",
	url: "https://creativecommons.org/licenses/by-nc-sa/4.0/",
};

export const expressiveCodeConfig: ExpressiveCodeConfig = {
	// Note: Some styles (such as background color) are being overridden, see the astro.config.mjs file.
	// Please select a dark theme, as this blog theme currently only supports dark background color
	theme: "github-dark",
};
