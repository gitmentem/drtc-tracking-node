export interface ApiResponse {
    status: string;
    message: string;
    details: any;
    grstatus?: string;
    grno?: string;
    from?: string;
    to?:string;
}

export interface IDetailsLine{
    date: string 
    particulars: string
}