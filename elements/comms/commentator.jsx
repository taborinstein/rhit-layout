export default function gen_comms(comms) {
    return (
        <>
            {comms.map((comm, index) => {
                // need index for unique keys

                // get out prefix and tag from comm
                const pref = comm.prefix;
                const tag = comm.tag;

                return (
                    <div key={index} className="comm">
                        <img src="icons/internal/mic.svg" />
                        <div className="name">
                            <div className="pref">{pref}</div>
                            <div className="tag">{tag}</div>
                        </div>
                    </div>
                );
            })}
        </>
    );
}
