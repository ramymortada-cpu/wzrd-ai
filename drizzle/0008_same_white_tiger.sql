ALTER TABLE `deliverables` ADD `fileUrl` text;--> statement-breakpoint
ALTER TABLE `deliverables` ADD `fileKey` text;--> statement-breakpoint
ALTER TABLE `deliverables` ADD `fileType` varchar(50);--> statement-breakpoint
ALTER TABLE `deliverables` ADD `qualityScore` int;--> statement-breakpoint
ALTER TABLE `deliverables` ADD `qualityChecklist` json;--> statement-breakpoint
ALTER TABLE `deliverables` ADD `reviewNotes` text;--> statement-breakpoint
ALTER TABLE `deliverables` ADD `imageUrls` json;