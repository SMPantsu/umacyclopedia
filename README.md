# UmaCyclopedia (UmaScanner Web Visualizer)

UmaCyclopedia is a web-based tool designed to help you browse, filter, and analyze your *Uma Musume: Pretty Derby* runner collection. By loading your `all_runners.json` data file, you can get a detailed and filterable view of all your runners, their stats, skills, and inheritance factors (sparks).

This tool runs entirely in your browser. Your data file is processed locally and is not uploaded to any server.

## Features

* **Load Your Data:** Simply load your `all_runners.json` file to get started. The tool remembers your data using your browser's local storage.
* **Three-Panel Dashboard:**
    * **Parent Summary:** A comprehensive overview of your runners, their stats, scores, and inheritable sparks (Blue, Green, Pink, White).
    * **White Sparks Legacy:** A specialized view to trace White Sparks from the runner's parents (Parent) and grandparents (GP1, GP2).
    * **Skills Summary:** A categorized breakdown of each runner's skills (Recovery, Passive, Speed/Accel, etc.), highlighting Gold and Unique skills.
* **Powerful Filtering:** Find the perfect runner by filtering on:
    * **Stats:** Set minimum values for Speed, Stamina, Power, Guts, and Wit.
    * **Aptitudes:** Filter by minimum grades for Track (Turf/Dirt), Distance (Sprint, Mile, etc.), and Style (Front, Pace, etc.).
    * **Sparks:** Create complex spark filters for Blue, Green, Pink, and White sparks. You can specify star count and filter for sparks on the parent only.
    * **Skills:** Search for runners that have one or more specific skills.
* **Detailed Runner View:** Double-click any runner in any tab to open a detailed modal. This view shows the runner's rank, all stats, all aptitudes, and a complete list of their skills with icons.
* **Dark & Light Mode:** Toggle between themes for comfortable viewing.

## How to Use

1.  **Get Your `all_runners.json` File:** You must first obtain your `all_runners.json` file the other side of this tool [UmaScanner](https://github.com/zeekb/UmaScanner).
2.  **Upload Your File:** On the welcome screen, click "Choose File," select your `all_runners.json` file, and click "Load Data."
3.  **Browse and Filter:**
    * Use the tabs at the top ("Parent Summary," "White Sparks Legacy," "Skills Summary") to change views.
    * Use the filter panel to narrow down your list of runners. You can add multiple spark and skill filters.
    * Double-click a runner's row to see their full detail card.
    * Double-click a grandparent's name (if not grayed out) to jump directly to that runner's entry.