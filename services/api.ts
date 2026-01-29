import { API_CONFIG, API_ENDPOINTS } from '@/config/api';

const API_BASE_URL = API_CONFIG.BASE_URL;

export interface State {
  id: number;
  state: string;
  statet_name?: string; // Tamil localized name (note: API uses 'statet_name')
  status?: number;
  created_at: string;
  updated_at: string;
}

export interface District {
  id: number;
  state_id: number;
  district_name: string;
  district_sname: string;
  district_tname: string;
  district_code: string;
  created_at: string;
  updated_at: string;
}

export interface Taluk {
  id: number;
  district_code: number;
  taluk_name: string;
  taluk_sname: string;
  taluk_tname: string;
  taluk_code: number;
  created_at: string;
  updated_at: string;
  district_name: string;
}

export interface Village {
  id: number;
  district_code: number;
  taluk_code: number;
  block: number | null;
  village_name: string;
  village_sname: string;
  village_tname: string;
  village_code: number;
  created_at: string | null;
  updated_at: string | null;
}

export interface ServiceCategory {
  id: number;
  service_category: string;
}

export interface ServiceSubcategory {
  id: number;
  category_id: number;
  subcategory: string;
}

export interface ApiResponse<T> {
  status: string;
  data: T;
}

export interface StatesResponse {
  states: State[];
  pagination: {
    page: number;
    limit: number;
    totalItems: number;
    totalPages: number;
  };
}

export interface DistrictsResponse {
  districts: District[];
  total: number;
}

export interface TaluksResponse {
  taluks: Taluk[];
  total: number;
  district_code: string;
}

export interface VillagesResponse {
  villages: Village[];
  total: number;
  district_code: string;
  taluk_code: string;
}

export interface Subdistrict {
  id: number;
  district_id: number;
  subdistrict_name: string;
  subdistrict_sname: string;
  subdistrict_tname: string;
  subdistrict_code: string;
  created_at: string;
  updated_at: string;
}

export interface SubdistrictsResponse {
  subdistricts: Subdistrict[];
  total: number;
}


export interface ServiceCategoriesResponse {
  status: string;
  data: ServiceCategory[];
}

export interface ServiceSubcategoriesResponse {
  status: string;
  data: ServiceSubcategory[];
}

export interface Fee {
  id: number;
  reg_fees: string;
  updated_by: number;
  created_at: string;
  updated_at: string;
}

export interface FeesResponse {
  status: string;
  data: {
    fees: Fee[];
    total: number;
  };
}

export interface EventItem {
  id: number;
  event_name: string;
  description: string;
  location: string;
  start_date: string;
  end_date: string;
  organizer: string;
  registration_url: string;
  image_url: string;
  status: number;
  created_by: number;
  created_at: string | null;
  updated_at: string | null;
}

export interface NewsItem {
  id: number;
  title: string;
  description: string;
  type: string;
  image_url: string;
  published_date: string;
  new: number;
  event_date: string;
  status: number;
  created_by: number;
  created_at: string;
  updated_at: string;
}

export interface InvestorFarmer {
  id: number;
  fullname: string;
  mobile_no: string;
  land_id: number | null;
  land_lattitude: string | null;
  land_longitude: string | null;
  last_harvest_date: string | null;
  village_name: string | null;
  village_tname: string | null;
  taluk_name: string | null;
  taluk_tname: string | null;
  district_name: string | null;
  district_tname: string | null;
  state: string | null;
  statet_name: string | null;
}

export interface InvestorFarmersResponse {
  status: number;
  success: boolean;
  message: string;
  data: InvestorFarmer[];
  total: number;
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface EventsResponse {
  status: string;
  data: EventItem[];
  count: number;
}

export interface NewsResponse {
  status: string;
  data: NewsItem[];
  count: number;
}

export interface CollectionEntryPayload {
  farmer_id: number;
  land_id: number;
  invester_id: number;
  collection_count: number;
  price_per_coconut: number;
  quallity_status: string;
}

export interface CollectionDetail {
  id: number;
  farmer_id: number;
  land_id: number;
  invester_id: number;
  collection_count: number;
  price_per_coconut: number;
  quallity_status: string;
  payment_status?: 'pending' | 'paid' | string | null;
  payment_id?: number | null;
  payment_amount?: number | null;
  payment_date?: string | null;
  created_at: string;
  updated_at: string;
}

export interface CollectionDetailsResponse {
  status: number;
  success: boolean;
  message: string;
  data: CollectionDetail[];
}

export interface LandDetailsUpdateData {
  land_ownership_type?: string;
  total_land_holding?: string;
  irrigation_source?: string;
  soil_type?: string;
  irrigation_type?: string;
  land_lattitude?: string;
  land_longitude?: string;
  village?: string;
  taluk?: string;
  district?: string;
  state?: string;
  pincode?: string;
  patta_number?: string;
  coconut_farm?: string;
  coconut_area?: string;
  no_of_trees?: string;
  trees_age?: string;
  estimated_falling?: string;
  last_harvest_date?: string;
  geo_photo?: any;
}

export const apiService = {
  async getStates(): Promise<State[]> {
    try {
      const response = await fetch(`${API_BASE_URL}/states/all`, {
        method: 'GET',
        headers: {
          'Cookie': '.Tunnels.Relay.WebForwarding.Cookies=CfDJ8Cs4yarcs6pKkdu0hlKHsZshvp_rGnxs3pBE3W9iehfQlePxo6_tOerNcR8rndNEF7-dMDJfS-pTwm3_bTwZJpO8QNqoPywQlCJjIYqJr4Ifx9fx7RYoUbSk2g7rOmBzUDPcxsD0FD00S2WFNdu5esQVRloltdylgCj9WAyxZnypx5hK6sfBOyvQv-SW8zJiyDYBAax7rStGjfwmNe3M5mewByqHHC0iaoZCxIhetARy4xMZzqhdtVZVsCir3ubsIUQ_yfBuiHOVwfGNrb1gnYPHG5VXUUvae3Zt9yJN-Fd4-LAhNcixIQihqNRjnW262wxllWXSAoi-N689GhKK4pNI6Z65jIKPJKsTqo9f686oqLPOe_ye-bzfjuSEhMFm1HlyakorQfzJayku36UCCrLMuu6EQcwTgKPtMkgfaEGbO4tJdKjEuc7zq4ojdeFyktNv-8t_qsKB0DscUcGmt6t1kyW9NGV3nDORm9qUhCnosGhxIeh6pKDSfwkTu_YzNFyoqTdcrlyPXRXHiHknKmQlkFXdJO66SZJ8_uzNMaQGnPpd0OABsaClVPg4bpmGirltG1VowbNt69mD9oiDgtyf2_QSBRy8tpdAA5Mv1-LwHMZrz06rvRq_mODQuDNmIfv7l_JHz3xWqtOXjt-tBXBRPgyoeOa7vzwsIA7gYHb2R7GoSmNbSpTLxANhgk7GgZVmEZydKSlmA-mbuG0hBiUEvMVvR-5eHce77jATn8EDP-b4TvgBMvcfbORhJgzrNVvtNQOhyQwL6LnRXFOhxAAPlLJYix2_06WdCgL6XpD_i3cbRwVLyJYpKTbusjKpBEAO5S4292XqZB1aE6-lASuSo3c_sfc_DlE2Ac43YSbIkgMRiD7OietNTAl7TS-OiRS9EtMW9eXZpPZ6PTbI-la0Dt4NSQ9kE0MkBD6m6TSG'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result: ApiResponse<StatesResponse> = await response.json();
      
      if (result.status === 'success') {
        return result.data.states;
      } else {
        throw new Error('API returned error status');
      }
    } catch (error) {
      return [];
    }
  },

  async getDistricts(stateId: number): Promise<District[]> {
    try {
      const response = await fetch(`${API_BASE_URL}/districts/state/${stateId}/all`, {
        method: 'GET',
        headers: {
          'Cookie': '.Tunnels.Relay.WebForwarding.Cookies=CfDJ8Cs4yarcs6pKkdu0hlKHsZshvp_rGnxs3pBE3W9iehfQlePxo6_tOerNcR8rndNEF7-dMDJfS-pTwm3_bTwZJpO8QNqoPywQlCJjIYqJr4Ifx9fx7RYoUbSk2g7rOmBzUDPcxsD0FD00S2WFNdu5esQVRloltdylgCj9WAyxZnypx5hK6sfBOyvQv-SW8zJiyDYBAax7rStGjfwmNe3M5mewByqHHC0iaoZCxIhetARy4xMZzqhdtVZVsCir3ubsIUQ_yfBuiHOVwfGNrb1gnYPHG5VXUUvae3Zt9yJN-Fd4-LAhNcixIQihqNRjnW262wxllWXSAoi-N689GhKK4pNI6Z65jIKPJKsTqo9f686oqLPOe_ye-bzfjuSEhMFm1HlyakorQfzJayku36UCCrLMuu6EQcwTgKPtMkgfaEGbO4tJdKjEuc7zq4ojdeFyktNv-8t_qsKB0DscUcGmt6t1kyW9NGV3nDORm9qUhCnosGhxIeh6pKDSfwkTu_YzNFyoqTdcrlyPXRXHiHknKmQlkFXdJO66SZJ8_uzNMaQGnPpd0OABsaClVPg4bpmGirltG1VowbNt69mD9oiDgtyf2_QSBRy8tpdAA5Mv1-LwHMZrz06rvRq_mODQuDNmIfv7l_JHz3xWqtOXjt-tBXBRPgyoeOa7vzwsIA7gYHb2R7GoSmNbSpTLxANhgk7GgZVmEZydKSlmA-mbuG0hBiUEvMVvR-5eHce77jATn8EDP-b4TvgBMvcfbORhJgzrNVvtNQOhyQwL6LnRXFOhxAAPlLJYix2_06WdCgL6XpD_i3cbRwVLyJYpKTbusjKpBEAO5S4292XqZB1aE6-lASuSo3c_sfc_DlE2Ac43YSbIkgMRiD7OietNTAl7TS-OiRS9EtMW9eXZpPZ6PTbI-la0Dt4NSQ9kE0MkBD6m6TSG'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result: ApiResponse<DistrictsResponse> = await response.json();
      
      if (result.status === 'success') {
        return result.data.districts;
      } else {
        throw new Error('API returned error status');
      }
    } catch (error) {
      return [];
    }
  },

  async getSubdistricts(districtId: number): Promise<Subdistrict[]> {
    try {
      const response = await fetch(`${API_BASE_URL}/subdistricts/district/${districtId}/all`, {
        method: 'GET',
        headers: {
          'Cookie': '.Tunnels.Relay.WebForwarding.Cookies=CfDJ8Cs4yarcs6pKkdu0hlKHsZshvp_rGnxs3pBE3W9iehfQlePxo6_tOerNcR8rndNEF7-dMDJfS-pTwm3_bTwZJpO8QNqoPywQlCJjIYqJr4Ifx9fx7RYoUbSk2g7rOmBzUDPcxsD0FD00S2WFNdu5esQVRloltdylgCj9WAyxZnypx5hK6sfBOyvQv-SW8zJiyDYBAax7rStGjfwmNe3M5mewByqHHC0iaoZCxIhetARy4xMZzqhdtVZVsCir3ubsIUQ_yfBuiHOVwfGNrb1gnYPHG5VXUUvae3Zt9yJN-Fd4-LAhNcixIQihqNRjnW262wxllWXSAoi-N689GhKK4pNI6Z65jIKPJKsTqo9f686oqLPOe_ye-bzfjuSEhMFm1HlyakorQfzJayku36UCCrLMuu6EQcwTgKPtMkgfaEGbO4tJdKjEuc7zq4ojdeFyktNv-8t_qsKB0DscUcGmt6t1kyW9NGV3nDORm9qUhCnosGhxIeh6pKDSfwkTu_YzNFyoqTdcrlyPXRXHiHknKmQlkFXdJO66SZJ8_uzNMaQGnPpd0OABsaClVPg4bpmGirltG1VowbNt69mD9oiDgtyf2_QSBRy8tpdAA5Mv1-LwHMZrz06rvRq_mODQuDNmIfv7l_JHz3xWqtOXjt-tBXBRPgyoeOa7vzwsIA7gYHb2R7GoSmNbSpTLxANhgk7GgZVmEZydKSlmA-mbuG0hBiUEvMVvR-5eHce77jATn8EDP-b4TvgBMvcfbORhJgzrNVvtNQOhyQwL6LnRXFOhxAAPlLJYix2_06WdCgL6XpD_i3cbRwVLyJYpKTbusjKpBEAO5S4292XqZB1aE6-lASuSo3c_sfc_DlE2Ac43YSbIkgMRiD7OietNTAl7TS-OiRS9EtMW9eXZpPZ6PTbI-la0Dt4NSQ9kE0MkBD6m6TSG'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result: ApiResponse<SubdistrictsResponse> = await response.json();
      
      if (result.status === 'success') {
        return result.data.subdistricts;
      } else {
        throw new Error('API returned error status');
      }
    } catch (error) {
      return [];
    }
  },

  async getTaluks(districtId: number): Promise<Taluk[]> {
    try {
      const response = await fetch(`${API_BASE_URL}/taluks/district/${districtId}`, {
        headers: {
          'Cookie': '.Tunnels.Relay.WebForwarding.Cookies=CfDJ8Cs4yarcs6pKkdu0hlKHsZvL1QlVfVsA9ey_1GDQkh2HxOY_AxjxDPcwz_HiOPRZ_HN1hjkidY6lCw7B7raW-Du12Rbra5_5EYdvWTDbc1Gh16z5rg9Hes0KjaSMsFAveJeqkuyLtPwiHDC0bUaSRgIHuxh0g3wPlLVTQTWzQclqAlLtaJ4TDgVNmsP5n6w1saGo8HRw-RqI7LH6h3byfbLoyqwg_y605tTOQsHVNYzZVp06C-X0_1rQAvg2TWuvzwRW6HsC1Jv4yB5URljVZ-jcZI65L0fB0Xbo4CHLRiClEnujfim8viSe6-rQIcqM3_Xqfr7ZzckutYhi8WUf5Y-XodnB0_EN0xrwR4cqXPFZtymkQGj_1XnHUrdvtBFClnxfX7CytFAZZRsh0Th74gDk_qW3xvKyp5OLB_JSnUxDpPfiwD9aBg-fxs1WrOh0oweOP9FgUEp458v8oyh4CT4HYPv6DBKf8Eyu2My1Utw3iD_UOt_-CP9y_qB8gvaLAxuJChvqbNp-8_nQTcyYFl3ZnGT1aPuvyME7Gq32FOpQZfdHI9NYvUnodCDTBPwT5okGDrrHTPMUpanCkhL3TuWVG08096nmtYFPfb8vkDbpCh5uvpWzuBzpvBOZx7Fh96DprKYUZwVsN83FzNfeWfFGB-j7o1j53u5TZLGBCcZ1sL9-GCznJkdaaT5N9oMBSeaLAuAHc3zxz56gFUT3ZMz7G2mr67eRz_tXsuhpzf1zqpZkdEA9uSYtN_9wcR1mQrz3T2YkDiCaryffoCCrVxqpYk9UDcH1GcjY7ubXmvo7PhEpbBL_8TzhdDj3UQ_85XEnGNRXlEGfCGVUPsa2ni7zkfVr2QWCkF5YDXZTAPUN9nqJdenbqfXfqPj1VapvjeLmQNRnyJpge8k0Si4bv5WDfSshWonI1CPlHJkEzHCz'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result: ApiResponse<TaluksResponse> = await response.json();
      
      if (result.status === 'success') {
        return result.data.taluks;
      } else {
        throw new Error('API returned error status');
      }
    } catch (error) {
      return [];
    }
  },

  async getVillages(districtId: number, talukId: number): Promise<Village[]> {
    try {
      const response = await fetch(`${API_BASE_URL}/villages/district/${districtId}/taluk/${talukId}`, {
        method: 'GET',
        headers: {
          'Cookie': '.Tunnels.Relay.WebForwarding.Cookies=CfDJ8Cs4yarcs6pKkdu0hlKHsZuY0_Tz8O1yv3ybHHnts5Ix_BnJGc4vJKr1Bc91U_wMGdATYJsXTGi5xBYXUlFjbGlJMbVPABmgy57And3-AAuBUqGosUVHyrOcn4yWtopi1kw4f9FjiSLXKdUDJhvKOAPWBDe9Z5jp2CKFMvY0rpHHIzt8pNvUx793Z7zY6b_0IFmDGX1EQaZ76CGPtGeBKdlktfkkFQ02LBoG1ms86wq7DtONRL4TQBJfFWXrU7Y9rCeWOXbp2LGUEzuywqeesNammDGTsmq8IY9btdZMJQC7dyG2edDT5SQXBG-y7ABRE-98dB5hmAq2vXkh4Wao9yYRDJNAczSiaPpeNKuU83mf41aXVOEs5XUfoGgH5f9uwByrubiYSh_U-Npt5CmO5BHlxSqGhzQgnxtU0S7vqNyBGaZkd3rWpxKsFCWqEaJWpDBvOXXAUbfRPzLVE_BtSboOUDvhkD5it-pMs36tvrItVPy4nxQP0Hb9WMasIZNoh2q57wh6gf8VGhWWqR3So9KVa1m9Qv7OZgYeP6POWeffhpqg6hlGQJJjfNCSD58Ej2EksVfzm2UVlpUCPOr9jt-4dsam3YLsr7WP-5NV8bIQwiwLp_kLhsEB0xhnRWLlPYer4a3c-Wm9uFteaAtl0fP1JOiTkK6y07Cy2E5oK_7fa2N6MHDyB24C1MCeV6ewhNTuuSt6lWAmQ_t7n8RQvLjRsio3UrZ90XsUn1eWzgQxA9hYOPOz8AczyL3IjwfDExRttq5Mtyi6_quUeuWaciWszHpVJV_Uc9bDT2E_5p8NX5HtXQ14UGuHwzQobnz5y7KHjrTGt56_m5jySiAtmUinu_hJoBzd74UrxJWuak5bvHcdFiKxcqGwA-67dZGqaD9W03kC_l8uhuvy6p2thx47wPLddlp5nvzxDd9eM1wS'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result: ApiResponse<VillagesResponse> = await response.json();
      
      if (result.status === 'success') {
        return result.data.villages;
      } else {
        throw new Error('API returned error status');
      }
    } catch (error) {
      return [];
    }
  },

  async getServiceCategories(): Promise<ServiceCategory[]> {
    try {
      const response = await fetch(`${API_BASE_URL}/users/service-categories`, {
        method: 'GET',
        headers: {
          'Cookie': '.Tunnels.Relay.WebForwarding.Cookies=CfDJ8Cs4yarcs6pKkdu0hlKHsZs5UqULAPS1zG9cUkbtXCgWS2_ZN8urDBg1NV4WMvL8hKaJa6bTDtPqaAmRi4IVTKFUQsqKixlCwadjX7qFjJRIRWcv7Sn13qr3aFiNdr8RSOxNNNNzz0XuBbGkq4yHCz3Ej1qZa7Be7Z69KzWmMgqR1uFOC7SMsC2iRa2FkodkrHpiPAYuGFXWqMXu1Lw64jF8FajEYG3L9-H-aoqL5pLF78wTLWcB02Bn2PaVQ6aoPRxNM1UP6RYpGsBvOESXDtR4NML8cLRD5P7Ujr3P_7UqnxrkT-b6cnlPEfe_rEc1rCYyaOYG1F4BKbMIJSZ7ms6IliqiGNjNGinIN3gMVNLZX640xUiz7juD_x0GeYffwI9MK0rwFhjKgFyatpzh4tJeE3dRIabLNpOZ0k90FNS0Ici550h97hG5DoD9y1X8Ni8hgF9iLrS_cAaX0nQf03osB7Z7Gbffdj_wqJYY12StwV9flLxWoynQkBNgFtmsmyGMsCk-7IeZv8jXTcSxaCuJeERqVPmOoEPQI5iMXRSssIj_qkFum6coW0wkXyvQJRwO6mFYjfd4sMYVQ96_K3SOMwQHSH_AOnKmK2uFq7YxpM4wPcEnMlyqshPNzgnvYsRtmiV16eXT4LRFRgjkn32EdphGtpqJF_Nb7HuTppzEc3eQ37mjyVdwGGeQqaF2Oqep_gypwf6mwLKeTaxS_gI2nV1KKXbBqlKDPRKU-nGtIt7PWHJwXw6lZEVR6LNoMMe2kQ07nNvdPFY4hvrm3dEzUlRBSaRte09ZVDRfFIiKsGl9dWj2dphsddm_jrtlkK1AK-x4rEu2Qo_f3aqqNseq62hV0BC-pHinwPioga8TuJX7r0U9-RLg3gdzNLdZgwDcclxaxRSDbdIpZ6jlgqjOrO3EYFrx7UhgdVad2t8T'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result: ServiceCategoriesResponse = await response.json();
      
      if (result.status === 'success') {
        return result.data;
      } else {
        throw new Error('API returned error status');
      }
    } catch (error) {
      return [];
    }
  },

  async getServiceSubcategories(categoryId: number): Promise<ServiceSubcategory[]> {
    try {
      const response = await fetch(`${API_BASE_URL}/users/service-subcategories?categoryId=${categoryId}`, {
        method: 'GET',
        headers: {
          'Cookie': '.Tunnels.Relay.WebForwarding.Cookies=CfDJ8Cs4yarcs6pKkdu0hlKHsZt0eAc-umXDAMwUgk3LuNeXovSRBJHpjWI02no-FOBVTOiqhkNmhp3pc9lZ2QzvapNVAwY-MVFjEBq4I-J09T5gR9tlvL6McyMZQsfIbQtFrZipw2lcWXtuDPWJhN5D4bYrS0_gN4N24BMve7hTQy4MHojBaJhuNFvL_9ovegVnrlR87p_N5X658w7EHJNYo_n-0GDnOQ_nN-qUfsaY1q-KcTDzJQTPejot9JwjoDyitwySHYbEjHHPJ7O10ZxwgPxE1dD3Qikv5a2I6coesv_DK_H_ntGXeeXMuC1jMqYDJ6CVcSCwAZp9pcx0kr0FW8WtBX1z0tkvSpwbwKME4Mzf0mNJEfYcm0wCqZ83jXTSe-_0dY42gzT1o6ZpoIs8C4HrujnsqD5s_kQ1DTPGuu3F8aakyFVbhLq3hyukadGxEjFiBiQ6i6nlczYOhYvHlO_0cCJ6mo58VH4in9K1EVlaU-iQIQuWgqASS8kGW7tRSKSfsq1pMq6KsRkrfb0LY6bq5hWJ5Skbg50m50UQV4NI52ThUZcCsz2gHJEcmN_vPPjxov_RbU7p4Pe3fILZ_PpUkubH6ots55PqRs1Fp_GUv5kWn7xTccygAuDoung5bJJt4tcqogl2P6zvteAczMM_vJdZL7vGiCr8x37KNiVQ5ws2JMmwYmcsXqTKInmVGNz70vln2xN0LwJx_jR04tYiaDxvMD7miKxtEsYsoMDksYKxwSSiPheIhTcwLtB0POH43rwkbZJ1VKRGwkuKQ88QpKFgbHYmkK0QLJX_5ORbNFAIDOVnZyIypKHqg1n2g9pfnIA-XTP3A_3iEw1kzhrFT6MG4VY9UF4odWTzwt4sTck82zB_nNHAkUSPPXZ3BcuibQAm6xbkYnQQM-n8n-ULjVJRBhHLENrQRaXeUZZJ'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result: ServiceSubcategoriesResponse = await response.json();
      
      if (result.status === 'success') {
        return result.data;
      } else {
        throw new Error('API returned error status');
      }
    } catch (error) {
      return [];
    }
  },

  async getFees(): Promise<number> {
    try {
      const response = await fetch(`${API_BASE_URL}/fees`, {
        method: 'GET',
        headers: {
          'Cookie': '.Tunnels.Relay.WebForwarding.Cookies=CfDJ8Cs4yarcs6pKkdu0hlKHsZspuj2YTd4qjkXe0_cq1sMoKXRzGDdvosCmwpF0axKrnEGBv2O4TImx3yxKCCbb6rP9Cf77XmTh0AlbWDeWcrJaqhJLK3P2fdYiYwj4vb7-isRbk2QfRzJsjB1mklohBFW8PXTJm3vJ5pcHLssEWcCKFl2KZWWbSjXM1is-SN0xIqMsSWEtC9o2VlOA07xPyd8jb1w6hpg_tTPiDvGiSfqsuKnRro-o-a609X2FpIC8XwvjHqv7nrWWp_LsCUmWsFQ--dddH1q_io_9BGQJzyJseC8GHTfffGhqiXCPXbECq6S_o5Fz9mnLuBfZ6IWHQsKkTe0kvt2GR4K9ROcMhL_La6q18Fdt6U2aDrxnFuGNsPCKLEHWM5935uOn26X1wQrfgtLJ1EHuZD8zyUzW8kR2MQz765_9LIGkjwFntCr9-VIfEjrY4IVtkZX5QnQV8HqKtq0oDRY0T2C50ihwH5idOGrWaMwCxFHpGAiISxgsccCmyuYQAs248n00zq6K5oVwctCtDDUv6wL50fzoAgFx8Y7VFXgFuIChGSz0jZRjVfkilE75JHXFCjMi68baBdnir7wFOqdgFjNeWchUUtBVScXaCdWco7W-OOjTuhS3CF-2DTqzfbppC1wWcwlza9VN4sVMwlLtuDYe_x28tnkBqOZ2YgWcvyZ0nvi0dQoS2if9sGlY02K0M6JL596s2ILSNmGK9PK3pHdMfr1o_j0csT4Q1wIYevW1WgOrASQ7S9jws6lUBW2Md_sbCaGg-XQj8Iz3dTOeibHRQLxHeJWxHK_BVUF2vkOrJVHvpOum-yHMvK4WFXHsK7mpnvH0_6kb9HLPJTVhDuvG35Ufie7RkI8wnRgGwhBIDqSOCw9g2_-D72Av0oYHFlosQEudWgVZ_sBHlEYNQsqkVDvCv6l7'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result: FeesResponse = await response.json();
      
      if (result.status === 'success' && result.data?.fees?.length > 0) {
        return parseInt(result.data.fees[0].reg_fees);
      } else {
        return 0;
      }
    } catch (error) {
      return 0;
    }
  },

  async getUpcomingEvents(token: string): Promise<EventItem[]> {
    try {
      const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.UPCOMING_EVENTS}/active`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Cookie': '.Tunnels.Relay.WebForwarding.Cookies=CfDJ8Cs4yarcs6pKkdu0hlKHsZuAll0Azj5MBQ0sV-6dhg7JC49Ua4snSWBrXMhTjpsri2olTeLwfYByLShPh4O5bAkVmV4xcZv5Lk12DbConmSxLbbbFPGc1dbuNUTHmL7GO6D_x_tDR7ZLtQlI80kprTEEEm3oAUcUxGWogLAgJUW5Spno98WbzUPYIq1Ll_nM_BpWRYlbucuAlAfoEKmOvpbKf2EuSjEMnzD7XLC8jb9krt9bh8-0ST-xwB1AKRiR7GjAs4uF8KGoj9sYIYzTRoF42lqwA8bXc6uaJzTi7Gq4xm_N4M7hm3VNgFLQZuJPv_1t0JplbopwEXOwDNGjoXHP01tfBbuuzNUpS1ZgirwcipyQ6cBoWeHLQXluVR1BIHwpx0nWAyVfj0JzsJI30HbGeb93QII0eAXoyoIFXGYfK0rP6GGFjs6cUzXMBFpfEuZJWq_YjBV7VRmiTQi6wJ2oGecrqWbTJldrMnLjgJF4-nmSRE8zEj5bAOllSP7qnOOz32J6W_6REdD9pW58ujlZ2FmEowWlcfYWuHcWTrRmNTt5LZeLxmE6q31kPJ-n0GIgH3tFBCPJrxiwWYVyV-n-jHeM3dAh7Os3yt0YFCZvdNakN8aHeX9r9sAA9P61PFL4r-am7jWQCupH0Ust3xlN_F6Snh4GIRFOvdXxOlFGsfeB6T9WOlogyLQ1Pt5gLHzprSF6mAytEBN7EknpJQcyYdbeTjTzyYeWQqLrPzHOzi_ETJKyBjxjKXyc3rphDzPxJshRcfcRO71bznp3iaQRm7j8NjsiGC0DJe-gmBal8h351E6bi1Y6NuZaV2kncpdpo_jb2Mz6o7U_jQ-0l78MD_DRminrnHrHPSr8py8NHnCqm9S3f3L5i2QdLTLWKG0J7j1O2bMQhA2GqadlvryYbs7GI85PySHPO-t2WbMO'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result: EventsResponse = await response.json();
      
      if (result.status === 'success') {
        return result.data;
      } else {
        throw new Error('API returned error status');
      }
    } catch (error) {
      return [];
    }
  },

  async getNewsEvents(token: string): Promise<NewsItem[]> {
    try {
      const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.NEWS_EVENTS}/active`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'Cookie': '.Tunnels.Relay.WebForwarding.Cookies=CfDJ8Cs4yarcs6pKkdu0hlKHsZv8qNuvMoVP0c1jwdTdAX3bc5TROaquiP7UnHGV67xM22edNpcD9Vl55yiltCebzq1JHNO0tvt79w8kRxQ9UI9ndh9fTn9dvMFENFzqmLd182K2sh9LLo1ExNaGR4Rdvva9btJAksUr4WbZjvhFS0Ryq8iOF1I7ZlWKjcqKWy5hQlBFFtIb5UxMCkVI0akbls0oO2pzazOcrz63YZFKIdfmTFFSGy0WWD05Gy-7IpEyVe1ed9sPuzwJgiyQgMLHxX4ACaVw5ruRKJUJetcvwkRJ6KpryH2Cg8ImKk4k4t6J1zCIIHdMszmQKsh4mgeDBRildoB88sWEw04zM9gEvDOhUPHQ_QePYFTIr4xOiakn8G429iqiDwAyw9EjSLR0MmsIUJEmZzqaC6HAWA4jtiQyFlNisSxMDzEDCgtcVhnAyMtW-1miUqCmuK6yJjlsmxjaV1KANtKsvrU_zOfP9QaJHMqEkxMYiy26j4IN1sMKSxxePf1o2fHZqnJi_v1DmIQ_92wDIt-VO1kDt2gsZRZ7BDscebaM2Opzx6FeZC6ug3Qg6BnbyBeDSt5kSLsVEedMztQKllPF0LGfMSz85S4JCkiLVz_694EQrGJqka5a7WJIpdniTiTdtO8Y2suu1dizN-ZS65jNYQCb_VU2PhuvJGDn2ZD_uVwQ1pS7WIF0J9XNIlANJivLwNv9AVErjAsEHLqI1b0n2X4JtwxLNNaueOq2-IWg8oZ97pPEfr2YA_Pk4UaAgjhiQk3Ab0wcdQyHwP4IDtF4iS4ZXLWjHARgndRC5pUQUXhUXUOqyrCTo57WH0L6BG5u9ej9t3iPxI1zbD4CYpm5VY_Y20EEPxcxMawAT4i77xbo1UHwq6mcOS0IhWQ51MzRMZ6lsxgOW5jTiLTJ0ziFhOy_kBNlh5lx'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result: NewsResponse = await response.json();
      
      if (result.status === 'success') {
        return result.data;
      } else {
        throw new Error('API returned error status');
      }
    } catch (error) {
      return [];
    }
  },

  async createCollectionEntry(payload: CollectionEntryPayload, token: string): Promise<boolean> {
    try {
      const response = await fetch(`${API_BASE_URL}/payments/collection-entry`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'Cookie':
            '.Tunnels.Relay.WebForwarding.Cookies=CfDJ8Cs4yarcs6pKkdu0hlKHsZs2G2qg0dW7yovxVH-Pf4n2xbBg4pEp-mzgz4vL2dwAhpmujI0Ea0XWf0zwIaRjmC8s4qQ012zoYfqoMzuLaW15ZWKevQ4Ytq0t0gd0U83wIY_M9TLdZF3UtLl-rnz-JMFvsUvhARHadcmjV-iI5__YSNkn6JAgU5sqCAVqtIbylfODWu3Wi_r3F5vHDXnCRoouu_exoiwUjNEqqBHrT7-aqkXpHn0D00-BmBT29AHcGGTkCIZ3Bf1Z8OxnTJSk9O2G5mK312-9ddDaii98J56yLW-c8wGx_YU4Jbkp3fZQwBuRoVMQxyOALrs6k9yKHLet8qSM3H8l7Ic2CRnxuwv_NxvQ_jkGDwga4gZ9V4MKg50XcU-JOptKxUx8aDPRX9-VL7dXGtpZwfxIA_8NZCVWhG63De3gMFX_eo8vrnDfOu4e6OltJ9kKh1yOkUxtsWgO_Szq_4PdqQikgXizi-riAvbnwGcsip36OorhuG1tX6APhVXU32g91llnaNlJ8bF-x2Qp6dlobMsHSBYheWQ2R3qmQw_HPvfKYMJaFWWpP478Z07mIP9sDvROCR6ZVNHo6iN8WH3HfakuKGrx82Mxt7n6OPoThI0GLAnetLJAQuHcxs4ovwFzhAWrLUQ0UUgvMjF_AyTTHA3IVsJ7QNDnAd5uuqFidprgS5M9sWVhBuc9toCwyULNB1ZQxcYd4jM1wGdS6Xa7C8ehWiIpJxivg91cF-XlsoQ4G3o35-SleeDtkB68QXB2jj4cAFtX8O72YRBogJr9WJfc9OM1quwEFQqtuXrJrwY4itwyBUsu0f7SyYXwnVQ3BJWseYfSgqxwcRysh86gaB-45nh5sSxyoCN-mkHdM8hIvAfDH275xY2pJ4PLHr8DRead8b2jMH_P60K3wYDGMVeFdnDY0ZOn',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const result = await response.json().catch(() => ({}));
        throw new Error(result?.message || `Failed with status ${response.status}`);
      }

      return true;
    } catch (error) {
      console.error('❌ Error creating collection entry:', error);
      throw error;
    }
  },

  async getCollectionDetails(
    farmerId: number | string,
    landId: number | string,
    token: string
  ): Promise<CollectionDetailsResponse> {
    try {
      const response = await fetch(`${API_BASE_URL}/payments/collection-details`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'Cookie':
            '.Tunnels.Relay.WebForwarding.Cookies=CfDJ8Cs4yarcs6pKkdu0hlKHsZsuq5lqNZJA9ovWTv6IJYe7GKDkyDp4fzWIyumCfpne-6IkfO4cQKxAhcRWyxRimvUPIaLRJwkh8tV6qHhoYBbIoIe89rtLbTRXfvCiqXCYFFEZU1KixskYt4wsxKMXWJ25VlRTwnDTDVThHJKeVStuynTjytvictadfzkMAQuylY_rNmdFFzNHytVMwVPoI6ZzzTRAGuyEdvWKzLQ8GkJtGB1Zh2TE4DbFxg2Db-wZEJKfld8f7ANvRJBxtp7p3FhwV5ecT0CjJLzJ89zbJDT8aOQHolB-LRzhWtxhONOjTvvyr3yCV-fkBGGrjXzbVfN-RMeX6FB2PoJ9gn35cA6TSbKMb1Q-ki6ZPhLa-7nV2JZl3Gv2GxDuVwIf034Mgb6HPUc_fLkeURkNg8N2Nk1sdQ5Sh7MjRWbYAi-xT8rFWv2wWDKv2KLHvV1vM3cRHoaCEW_MspxLea0CDxc-iXIoHO2KlXdKE2qJLiq8Cqq49EP9n68d1m951tml5-MMcyjpDgX7RmHvr5_8Yv9smYZbAV6X1bAwi6uuuuISAdte97Lu96n69nLDa9mivCch0HJKZIaOGUTX5WYf5PQR62kT-8mLe0UM3klw4pcHE95sLJGDhc_pN6gjZDijpuig2XyMf1QspKt9K3iVHtkkHXu1aiCzubmHK_TgyyprNEuMoaIj5TncnCjNd8XqH3x3Mo9PnH2JinI2HapyT5uafcHAb7YaoXKZo2OxuVDz74QNTThzhyKq0sQQA2_KFSB2tV42PuIKrElHnrfm_7t22bSCwrUQszD8mSXeYOrCDkj4LBSt95QthO6I3NMeAXaEqupdvsaftih-scnx3Y2DSQLiXNm-M66OMyq_1N0vBULOSiWTs23i7sprEZiagsbYmVTrwkEh350fpxdEGyYIhxRR',
        },
        body: JSON.stringify({
          farmer_id: Number(farmerId),
          land_id: Number(landId),
        }),
      });

      if (!response.ok) {
        const text = await response.text();
        throw new Error(text || `Failed with status ${response.status}`);
      }

      const result: CollectionDetailsResponse = await response.json();
      return result;
    } catch (error) {
      console.error('❌ Error fetching collection details:', error);
      throw error;
    }
  },

  async getInvestorFarmers(
    investorId: number | string,
    token: string,
    params: { start?: number; length?: number; status?: number; search?: string } = {}
  ): Promise<InvestorFarmersResponse> {
    const query = new URLSearchParams({
      start: String(params.start ?? 0),
      length: String(params.length ?? 10),
      status: String(params.status ?? 1),
    });
    
    if (params.search) {
      query.append('search', params.search);
    }

    try {
      const response = await fetch(`${API_BASE_URL}/users/investor-farmers/${investorId}?${query.toString()}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'Cookie':
            '.Tunnels.Relay.WebForwarding.Cookies=CfDJ8Cs4yarcs6pKkdu0hlKHsZuqQMONg0J1epX0ELIIHJmgh3x2pawKZbUok9HN9K719gRSLhWa4cWRK4E25x1RKC6HCyRxJ88LR71yFMVxdTidnl3PZ8p87ezo5Qd3f9c72UXIH8MWx62uwTBXyQZ_cSeMTuTEJKC7Bt1bKIIG3mzcFmTaVTkRb91cSvl7oApx3hHnCXD8QLP3ns0G8fkdFN1VWYq1uIyDuMyCuycptcROLphL1l2CZfcc_8oz_B79ecw6Nem6Up5PLE3Y4hoy2c7oWJlME0v_aGre2GsSFl6aKu0W4w701uUn0dWokNeFYIzZHE_axgeAfbpQ8vWaJZ4nYKuOZfB7_JrZy5DbSCVC9dBHjbCjz0bqwi9O1Dx5pT-RompUr3779Iw1pf8p_TT5Xg5mUBf2bgAKE9iPh2NUexPI2ldFGB7s3ZsXWpp3ltO8GLThI9uq5Tt_L3F4QhiB8tu-GyiTElQYXjpx3_Rx_CXBqDfWl9HW8f5jLH5zWIbcIbtzkeHLFxiWTHW5F0hywWBCKpxfu_c0F7Iu2KAqsiaaEXpxUCt_0oqZKj0m3bN1D9oBCuATrkZb6I35gZ9bLGmUz9fhM17w3BuJtVgKCmX1JoTF-zOjRAAeg76QUnH4PQTIL0MbiDJZOIElKkyIYvlGZIrHLAuaoIvWidDarD4_B68RCBLdJKhp4_uP2gMuuyUocu4iyZSOUSRLZWvSM6Sb57nclkILdRFhYe5Lelpu2beBntYICLrAWheEYbKvznrVy7ClJUrK5ESEYFlbtikfDADVFkinUB_gRlLAGntbep_wWZc_VxpD_Ep2ObSozsE9jVwr8KK7N9BuVZS1c3fFWX4RHVb_0SNMIEPiiU7SX63upjPvs5kal-zGpObvFGDf3v61DxnWTODrA_QSrSqERwmltTkUfEF3M7xy',
        },
      });

      if (!response.ok) {
        throw new Error(`Unable to fetch investor farmers. Status: ${response.status}`);
      }

      const result: InvestorFarmersResponse = await response.json();
      return result;
    } catch (error) {
      console.error('❌ Error fetching investor farmers:', error);
      throw error;
    }
  },

  async updateLandDetails(landId: number, data: LandDetailsUpdateData, token: string): Promise<boolean> {
    try {
      console.log('API Service - updateLandDetails - Start:', {
        landId,
        url: `${API_BASE_URL}${API_ENDPOINTS.UPDATE_LAND_DETAILS}/${landId}`,
        timestamp: new Date().toISOString()
      });

      console.log('API Service - updateLandDetails - Payload:', {
        landId,
        data,
        dataKeys: Object.keys(data),
        timestamp: new Date().toISOString()
      });

      const formData = new FormData();
      
      Object.keys(data).forEach(key => {
        const value = data[key as keyof LandDetailsUpdateData];
        if (value !== null && value !== undefined) {
          formData.append(key, String(value));
          console.log(`API Service - FormData append: ${key} = ${String(value)}`);
        }
      });

      console.log('API Service - updateLandDetails - Request Headers:', {
        landId,
        hasToken: !!token,
        tokenLength: token?.length,
        timestamp: new Date().toISOString()
      });

      const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.UPDATE_LAND_DETAILS}/${landId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      });

      console.log('API Service - updateLandDetails - Response:', {
        landId,
        status: response.status,
        statusText: response.statusText,
        ok: response.ok,
        headers: Object.fromEntries(response.headers.entries()),
        timestamp: new Date().toISOString()
      });

      if (!response.ok) {
        const responseText = await response.text();
        console.log('API Service - updateLandDetails - Error Response Body:', {
          landId,
          responseText,
          timestamp: new Date().toISOString()
        });
      }

      return response.ok;
    } catch (error) {
      console.error('API Service - updateLandDetails - Error:', {
        landId,
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        timestamp: new Date().toISOString()
      });
      return false;
    }
  },

  makePayment: async (
    investorId: number,
    collectionId: number,
    farmerId: number,
    paymentMode: string,
    amount: number,
    token: string
  ) => {
    try {
      console.log('API Service - makePayment - Request:', {
        investorId,
        collectionId,
        farmerId,
        paymentMode,
        amount,
        timestamp: new Date().toISOString()
      });

      const response = await fetch(`${API_BASE_URL}/payments/make-payment`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          invester_id: investorId,
          collection_id: collectionId,
          farmer_id: farmerId,
          payment_mode: paymentMode,
          amount: amount,
        }),
      });

      const result = await response.json();

      console.log('API Service - makePayment - Response:', {
        status: response.status,
        statusText: response.statusText,
        responseData: result,
        timestamp: new Date().toISOString()
      });

      if (response.ok && result.status === 'success') {
        return { success: true, data: result.data };
      } else {
        return { success: false, message: result.message || 'Payment failed' };
      }
    } catch (error) {
      console.error('API Service - makePayment - Error:', error);
      return { success: false, message: error instanceof Error ? error.message : 'Network error' };
    }
  },

  raiseRequest: async (
    title: string,
    description: string,
    priority: string,
    token: string
  ) => {
    try {
      console.log('API Service - raiseRequest - Request:', {
        title,
        description,
        priority,
        timestamp: new Date().toISOString()
      });

      const response = await fetch(`${API_BASE_URL}/requests/raise`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          title,
          description,
          priority,
        }),
      });

      const result = await response.json();

      console.log('API Service - raiseRequest - Response:', {
        status: response.status,
        statusText: response.statusText,
        responseData: result,
        timestamp: new Date().toISOString()
      });

      if (response.ok && result.status === 'success') {
        return { success: true, data: result.data, message: result.message || 'Request raised successfully' };
      } else {
        return { success: false, message: result.message || 'Failed to raise request' };
      }
    } catch (error) {
      console.error('API Service - raiseRequest - Error:', error);
      return { success: false, message: error instanceof Error ? error.message : 'Network error' };
    }
  },

  getCollectionHistory: async (
    farmerId: number,
    investorId: number | null,
    start: number = 0,
    length: number = 10,
    token: string
  ) => {
    try {
      const params = new URLSearchParams({
        start: start.toString(),
        length: length.toString(),
        farmer_id: farmerId.toString(),
      });

      if (investorId) {
        params.append('invester_id', investorId.toString());
      }

      const response = await fetch(`${API_BASE_URL}/payments/collection-history?${params.toString()}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });

      const result = await response.json();

      if (response.ok && result.success) {
        return {
          success: true,
          data: result.data || [],
          total: result.total || 0,
          pagination: result.pagination || {},
        };
      } else {
        return { success: false, message: result.message || 'Failed to fetch collection history', data: [], total: 0 };
      }
    } catch (error) {
      console.error('API Service - getCollectionHistory - Error:', error);
      return { success: false, message: error instanceof Error ? error.message : 'Network error', data: [], total: 0 };
    }
  },

  getPaymentHistory: async (
    farmerId: number,
    start: number = 0,
    length: number = 10,
    token: string
  ) => {
    try {
      const params = new URLSearchParams({
        start: start.toString(),
        length: length.toString(),
        farmer_id: farmerId.toString(),
      });

      const response = await fetch(`${API_BASE_URL}/payments/history?${params.toString()}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });

      // Check if response has content before parsing
      const responseText = await response.text();
      
      if (!responseText || responseText.trim() === '') {
        console.warn('API Service - getPaymentHistory - Empty response');
        return { success: true, data: [], total: 0, pagination: {} };
      }

      let result;
      try {
        result = JSON.parse(responseText);
      } catch (parseError) {
        console.error('API Service - getPaymentHistory - JSON Parse Error:', parseError);
        console.error('Response text:', responseText);
        return { success: false, message: 'Invalid JSON response from server', data: [], total: 0 };
      }

      if (response.ok && result.success) {
        return {
          success: true,
          data: result.data || [],
          total: result.total || 0,
          pagination: result.pagination || {},
        };
      } else {
        return { success: false, message: result.message || 'Failed to fetch payment history', data: [], total: 0 };
      }
    } catch (error) {
      console.error('API Service - getPaymentHistory - Error:', error);
      return { success: false, message: error instanceof Error ? error.message : 'Network error', data: [], total: 0 };
    }
  },

  acknowledgePayment: async (
    paymentId: number,
    token: string
  ) => {
    try {
      console.log('API Service - acknowledgePayment - Request:', {
        paymentId,
        timestamp: new Date().toISOString()
      });

      const response = await fetch(`${API_BASE_URL}/payments/acknowledge-payment`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          payment_id: paymentId,
        }),
      });

      const responseText = await response.text();
      
      if (!responseText || responseText.trim() === '') {
        console.warn('API Service - acknowledgePayment - Empty response');
        return { success: false, message: 'Empty response from server' };
      }

      let result;
      try {
        result = JSON.parse(responseText);
      } catch (parseError) {
        console.error('API Service - acknowledgePayment - JSON Parse Error:', parseError);
        console.error('Response text:', responseText);
        return { success: false, message: 'Invalid JSON response from server' };
      }

      console.log('API Service - acknowledgePayment - Response:', {
        status: response.status,
        statusText: response.statusText,
        responseData: result,
        timestamp: new Date().toISOString()
      });

      if (response.ok && result.success) {
        return { success: true, message: result.message || 'Payment acknowledged successfully', data: result.data };
      } else {
        return { success: false, message: result.message || 'Failed to acknowledge payment' };
      }
    } catch (error) {
      console.error('API Service - acknowledgePayment - Error:', error);
      return { success: false, message: error instanceof Error ? error.message : 'Network error' };
    }
  }
};