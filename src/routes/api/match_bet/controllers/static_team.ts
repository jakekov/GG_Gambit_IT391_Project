import team_model, { StaticTeam, StaticTeamOptions } from "@/models/staticTeams";

//the all doesnt work so just manually check each region


/**
 * Finds a team id from a unique name and country
 * If it is not in the database it goes throught the /api/v1/teams to find a match
 * @param name team name
 * @param country team country
 * @returns Team database entry info
 */
export async function findTeamId(
  name: string,
  country: string,

): Promise<StaticTeam | null> {
  //do caching but not right now
  
  let teams = await team_model.getTeamByUniqueName(name, country);
  if (teams.length == 0) {
    
    let [id, img] = await scrapeSearchVlrTeam(name);
    if (id === -1) {
        console.log(`team does not exist ${name}, ${country}`);
        return null};
        if (img === null) console.log("warn team insert image is null");
    let static_team: StaticTeamOptions = {
        id: id,
        name: name,
        country: country,
        img: img,
    }
    await team_model.createStaticTeam(static_team);
    let teams = await team_model.getTeamByUniqueName(name, country);
    if (teams.length == 0) {
      console.log(`team does not exist ${name}, ${country}`);
      return null;
    }
    return teams[0];
  }
  return teams[0];
}
interface TeamJson {
  status: string;
  size: number;
  data: StaticTeam[];
  pagination: Pagination;
}
interface Pagination {
  page: number;
  limit: number;
  totalElements: number;
  totalPages: number;
  hasNextPage: boolean;
}
const team_search_cooldown_us: number = 600000; 
var last_search_time: number = 0;
const regionAvailable = [
    "na",
    "eu",
    "br",
    "ap",
    "asia",
    "pacific",
    "kr",
    "ch",
    "jp",
    "la-s",
    "la-n",
    "oce",
    "mena",
    "gc",
];
/**
 * Goes through the vlresports teams api
 * populates staticTeams database with any new teams 
 * default all does not work it only displays 130 teams not sure what the deal is
 */
//THIS DOESNT WORK
//vlr teams just does rankings and only shows top 400 in a region
async function populateStaticTeams() {
  if (last_search_time + team_search_cooldown_us > Date.now()) {
    return;
  }
  last_search_time = Date.now();
console.log("searching teams");
for (const region of regionAvailable) {
    console.log(region);
    let counter = 1;
  while (true) {
    let res = await fetch(
      `http://10.111.21.84:5000/api/v1/teams?limit=50&page=${counter}&region=${region}`
    )
      .then((res1) => res1.json())
      .then((res1) => {
        return res1 as TeamJson;
      });

    for (const team of res.data) {
      //make this faster
      try {
        let entry = await team_model.getTeamById(team.id);
        if (entry.length != 0) continue;
        await team_model.createStaticTeam(team);
      } catch (err) {
        console.log(err);
      }
    }
    if (!res.pagination.hasNextPage) break;
    counter += 1;
  }
}
  
}
import * as cheerio from "cheerio";
async function scrapeSearchVlrTeam(team: string): Promise<[number, string | null]> {
    //console.log(`https://vlr.gg/search/?q=${team}&type=teams`);
    const data = await fetch(`https://vlr.gg/search/?q=${team}&type=teams`);
    if (data.status != 200) {
        console.log("Scrape error");
        console.log(data);
        return [-1, null];
    }
    var found_id = -1;
    var img = null;
    let html = await data.text();
    const $ = cheerio.load(html);
    $(".wf-card").each((_, el) => {
    const link = $(el).find("a.wf-module-item.search-item").attr("href");
    if (link?.startsWith("/team/")) {
        var spaceReg = new RegExp('/\s+/', 'g');
        var andReg = new RegExp('&','g');
        let formatted_team = team.replace(/[^A-Za-z\s]/g, '').toLowerCase();
         formatted_team = formatted_team.trim().replace(/\s+/g, '-');
        let end_idx = link.indexOf(formatted_team, 5);
        if (end_idx < 7) return true; //continue next iter
         
      
      let id = link.substring(6,end_idx -1);
      found_id = parseInt(id);



       img = $(el).find("img").attr("src");
      if (img && img.startsWith("//")) {
    // Make it a full URL 
    img = "https:" + img;
  }
      return false;
    }
  });
  return [found_id, img];
}
