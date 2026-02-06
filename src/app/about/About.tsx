import React from 'react';
import './About.scss';
//@ts-ignore
import CBILogo from '../../assets/about-us/CBI_Logo_Final_CMYK-01.png';
//@ts-ignore
import CAI from '../../assets/about-us/CAI2R_PURPLE_RGB.png';
//@ts-ignore
import nibib from '../../assets/about-us/nibib_logo.png';

function AboutPage() {
    return (
        <div className="m-4 row" id={'about-root'} style={{ justifyContent: 'center', display: 'flex', fontSize: '11pt' }}>
            <div className="col-md-8">
                <div className="card">
                    <div className="card-header">About</div>

                    <div className="m-5">
                        <div className="container py-2">
                            <p className="cmTitle">CAMRIE</p>
                            {description}
                        </div>
                        {/* <div className="container py-2">
                            <p className="cmTitle">Documentation</p>
                            {doc}
                        </div> */}
                        {/* <div className="container py-1">
                            <p className="cmTitle">Collaborate with Us</p>
                            {collaborate}
                        </div> */}
                        {/* <div className="container py-1">
                            <p className="cmTitle">Acknowledgement</p>
                            {ack}
                        </div> */}
                        {/* <div className="container py-2">
                            <p className="cmTitle">Funding</p>
                            {funding}
                        </div> */}
                        <div className="container py-2">
                            <p className="cmTitle">Please cite the following publications if you use CAMRIE</p>
                            {refs}
                        </div>
                        {/* <div className="container py-2">
                            <p className="cmTitle">Publications using Cloud MR</p>
                            {publications}
                        </div> */}
                    </div>
                </div>
            </div>
        </div>
    );
}

const description = (
    <div className="cmParagraph">
        {/* <div className="cmText">
            TESS (<strong>T</strong>emperature <b>E</b>stimation from <b>S</b>AR <b>S</b>imulations) is a web-based application that performs safety assessment for MRI exams. It relies on a solution of the Bioheat equation to generate temperature maps from simulated maps of the specific absorption rate (SAR) and vice versa.
            <ul style={{ marginBottom: "0px" }}>
                <li>Principal Investigator: <a href="https://cbiweb.net/team/riccardo-lattanzi-phd/" target="_blank">Riccardo Lattanzi, PhD</a></li>
                <li>Head of Software Development: <a href="https://cbiweb.net/team/eros-montin-phd/" target="_blank">Eros Montin, PhD</a></li>
                <li>Collaborators: <a href="https://www.linkedin.com/in/giuseppe-carluccio-84baa4187/" target="_blank">Giuseppe Carluccio</a>, <a href="https://cbiweb.net/team/christopher-collins-phd/" target="_blank">Christopher Collins</a>, <a href="https://cbiweb.net/team/roy-wiggins/" target="_blank">Roy Wiggins</a>, <a href="https://cbiweb.net/team/xuan-thao-nguyen" target="_blank">Xuan Thao Nguyen</a></li>
            </ul>
        </div> */}
        <div>
            CAMRIE is a web-based MRI simulator built for rapid and accessible evaluation of new MRI technologies. It integrates both a cloud-native backend and a React frontend, enabling simulations from any device. Simulations are executed remotely via AWS Lambda functions and stored centrally for further analysis and sharing.
        </div>
    </div>
);

const doc = (
    <div className="cmParagraph">
        <div className="cmText">
            Our python sources are available <a href="https://github.com/cloudmrhub/mroptimum-tools" target="_blank">here</a>. User manuals and video tutorials will be available in the future.
        </div>
    </div>
);

// const collaborate = (
//     <div className="cmParagraph">
//         <div className="cmText">
//             <a href="/contact" target="_blank">Contact us</a> if you are interested in integrating your MRI toolbox into the <span className="cloudmrTag">Cloud MR</span> framework.
//         </div>
//     </div>
// );

// const ack = (
//     <div>
//         <div className="cmParagraph">
//             <div className="cmText">
//                 The frontend of Cloud MR is based on HTML 5, JavaScript, and CSS 3, using <a href="https://vuejs.org/">Vue.js</a>/<a href="https://en.reactjs.org/">React.js</a>, PhP and MySQL with <a href="https://laravel.com/">Laravel</a> for the backend. Several people have contributed to the Cloud MR project, including: Giuseppe Carluccio, Tobias Block, Roy Wiggins, Jean-Claude Franchitti, Jordan Starcher, Alex Mammadov, Adam Rubens, August Gresens.
//             </div>
//         </div>
//         <div className="form-group row justify-content-left">
//             <div className="col-md-4 text-left">
//                 <img src={CBILogo} style={{ width: "75%", marginTop: "5pt", marginBottom: "5pt" }}/>
//             </div>
//             <div className="col-md-4 text-left">
//                 <img src={CAI} style={{ width: "100%", marginTop: "5pt", marginBottom: "5pt" }}/>
//             </div>
//         </div>
//     </div>
// );

const funding = (
    <div>
        <div className="cmParagraph">
            <div className="cmText">
                TESS is available through the Cloud MR software application framework. This research project is supported by the National Institute of Biomedical Imaging and Bioengineering (<a href='https://www.nibib.nih.gov/' target='_blank'>NIBIB</a>) of the National Institutes of Health (<a href='https://www.nih.gov/' target='_blank'>NIH</a>) under Award Number R01 EB024536. The content is solely the responsibility of the authors and does not necessarily represent the official views of the National Institutes of Health.
            </div>
        </div>
        <div>
            <img src={nibib} style={{ width: '200px', marginTop: "5pt", marginBottom: "5pt" }} />
        </div>
    </div>
);

const refs = (
    <ul style={{ marginBottom: "0pt", listStyleType: "none" }}>
        <li className="cmReference">
            Montin E, Carluccio G, Collins CM, Lattanzi R. CAMRIE - cloud-accessible MRI emulator. Proceedings of the 28th Annual Meeting of the International Society for Magnetic Resonance in Medicine; August 8–14, 2020; Virtual Conference. Abstract 1037.
        </li>
    </ul>
);

// const publications = (
//     <ul style={{ marginBottom: "0pt", listStyleType: "none" }}>
//         <li className="cmReference">
//             Montin E and <span style={{ fontWeight: "bold" }}>Lattanzi R</span>, <em>Seeking a widely adoptable practical standard to estimate signal-to-noise ratio in magnetic resonance imaging for multiple-coil reconstructions</em>; Journal of Magnetic Resonance Imaging, vol 54(6), 2021, p. 1952-1964. <a href="https://doi.org/10.1002/jmri.27816">DOI: 10.1002/jmri.27816</a>
//         </li>
//     </ul>
// );


export default AboutPage;