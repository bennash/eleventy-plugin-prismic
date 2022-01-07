// @ts-expect-error - 11ty does not provide any sort of type definition
import { EleventyServerlessBundlerPlugin } from "@11ty/eleventy";

import { name as pkgName, version as pkgVersion } from "../package.json";
import {
	dPrismic,
	dPrismicClient,
	dPrismicPreview,
	dPrismicShortcodes,
} from "./lib/debug";
import { EleventyConfig, PrismicPluginOptions } from "./types";
import { crawlAndSort } from "./crawlAndSort";
import { injectShortcodes } from "./shortcodes";
import { injectPairedShortcodes } from "./pairedShortcodes";
import { hasClientInOptions } from "./hasClientInOptions";
import { createClientFromOptions } from "./createClientFromOptions";
import { hasPreviewInOptions } from "./hasPreviewInOptions";

/**
 * Prismic plugin for Eleventy, injects Prismic documents into Eleventy global data and provides useful shortcodes
 *
 * @example
 * Basic usage
 *
 * ```
 * const prismicPluginOptions = definePrismicPluginOptions({
 *   endpoint: "my-repo",
 * });
 *
 * eleventyConfig.addPlugin(pluginPrismic, prismicPluginOptions);
 * ```
 *
 * @example
 * With shortcodes deactivated
 *
 * ```
 * const prismicPluginOptions = definePrismicPluginOptions({
 *   endpoint: "my-repo",
 *   injectShortcodes: false,
 * });
 *
 * eleventyConfig.addPlugin(pluginPrismic, prismicPluginOptions);
 * ```
 */
export const pluginPrismic = (
	eleventyConfig: EleventyConfig,
	options: PrismicPluginOptions = {},
): void => {
	dPrismic("Plugin init process started");
	dPrismic("Running with %o", `${pkgName}@${pkgVersion}`);

	// Client & preview
	if (hasClientInOptions(options)) {
		dPrismicClient("Creating client");

		const client = createClientFromOptions(options);

		dPrismicClient("Client created, starting to fetch documents");

		// Get documents only once
		const documents = crawlAndSort(client, options);

		eleventyConfig.addGlobalData("prismic", () => documents);
	} else {
		dPrismicClient(
			"`client` nor `endpoint` were provided through the plugin options, documents won't be fetched and preview features won't be enabled",
		);
	}

	// Preview
	if (hasPreviewInOptions(options)) {
		dPrismicPreview("Enabling Prismic preview");

		eleventyConfig.addPlugin(EleventyServerlessBundlerPlugin, options.preview);
	}

	// Shortcodes
	if (options.injectShortcodes !== false) {
		if (options.shortcodesNamespace && options.shortcodesNamespace !== "") {
			dPrismicShortcodes(
				"Injecting shortcodes under the %o namespace",
				options.shortcodesNamespace,
			);
		} else {
			dPrismicShortcodes("Injecting shortcodes");
		}

		// Injects basic shortcodes
		injectShortcodes(
			options.shortcodesInjector?.bind(eleventyConfig) ||
				eleventyConfig.addShortcode.bind(eleventyConfig),
			options,
		);

		// Injects paired shortcodes
		injectPairedShortcodes(
			options.shortcodesPairedInjector?.bind(eleventyConfig) ||
				eleventyConfig.addPairedShortcode.bind(eleventyConfig),
			options,
		);
	} else {
		dPrismicShortcodes(
			"`injectShortcodes` has been turned off, shortcodes won't be injected",
		);
	}

	dPrismic("Plugin inited");
};
