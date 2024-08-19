/*
    *** IMPORTANT ***
    - `flags.dnd5e.powerfulBuild` needs to be included in checking if the target is shoveable and in calculating the shove distance!
    

    shoveOptions = {        //comments explain what each options does if set to true/non-default
        skipCheck: false,                   //don't make a check and don't make the target make a check
        ignoreSizeRequirements: false,      //don't check if the actor meets the size requirement to shove the target
                                                size difference is still factored in for calculating distance
        ignoreShoveImmunity: false,         //shove the target even if it has shove immunity
        overrideShoveDistance: null,        //if a number is provided, it overrides the distance the target is getting shoved (size difference is not factored in)

        distanceMsgOnly: false,             //only print a message saying how far a token would be displaced
    }

    await TaliaCustom.shoveAction(shoveSource, shoveTarget, shoveOptions) {

        ** shoveSource and shoveTarget are both tokens!!! **


        - is target immune?         (options??)
        - is target shoveable?      (options??)
        - calculate shove distance  (options??)
        - make shove check (shoveSource only)         (options??)

        ** Let the targetToken's owner handle this via requestor.
        ** pass shoveSource, sourceShoveCheckResult, shoveDistance

        - make shove check (shoveTarget only)
        - calculate displacement
            - displacement direction is a straight line from shoveSource to shoveTarget
            - check wall collision
            - snap to grid
        - move shoveTarget to calculated position
            use Sequencer to move the token and to play the animation
    }
*/

export default {
    _onDAESetup() {
        const fields = [];
        fields.push("flags.talia-custom.shove.sizeBonus");
        fields.push("flags.talia-custom.shove.distBonus");
        fields.push("flags.talia-custom.shove.isImmune");   
        window.DAE.addAutoFields(fields);
    },
}