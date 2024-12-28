export default function gen_comms(comms) {
    return (
        <>
            {comms.map(c => {
                let parts = c.split("|").map(x => x.trim());
                let user = parts.pop();
                let pref = "";
                if (parts.length > 0) pref = parts[0];
                return (
                    <div key={c} className="comm">
                        <img src="icons/internal/mic.svg" />
                        <div className="name">
                            <div className={pref == "" ? "nopref" : ""}>{pref}</div>
                            <div>{user}</div>
                        </div>
                    </div>
                );
            })}
        </>
    );
}
