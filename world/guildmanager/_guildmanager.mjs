import { TaliaCustomAPI } from "../../scripts/api.mjs"
import Guild from "./guild.mjs"

export default {
    registerSubsection() {
        TaliaCustomAPI.add( {Guild} , "none");
    }
}
