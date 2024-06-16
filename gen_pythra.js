import Jimp from 'jimp';
for(let i = 0; i < 8; i++) {
    Jimp.read(`icons/chara_2_eflame_0${i}.png`, async (_, pyra) => {
        Jimp.read(`icons/chara_2_elight_0${i}.png`, async (_, mythra) => {
            for(let x = 0; x < 64; x++) {
                for(let y = 0; y < 64; y++) {
                    if (x + y - 2> 64) pyra.setPixelColor(mythra.getPixelColor(x, y), x,y);
                }
            }
            await pyra.write("icons/chara_2_pythra_0" + i + ".png")
        });

    });
}